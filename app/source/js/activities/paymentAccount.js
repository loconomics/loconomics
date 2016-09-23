/**
    PaymentAcount activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var createPostalCodeAutolookup = require('../utils/createPostalCodeAutolookup');

var A = Activity.extend(function PaymentAccountActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: '/help/relatedArticles/201967096-accepting-and-receiving-payments'
    });
    
    this.defaultNavBar = this.navBar.model.toPlainObject(true);
    
    this.registerHandler({
        target: this.app.model.paymentAccount,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your payment account.' : 'Error loading your payment account.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.updateNavBarState();

    // Discard any previous unsaved edit
    this.viewModel.discard();
    // Keep data updated:
    this.app.model.paymentAccount.sync();
};

function ViewModel(app) {

    this.isInOnboarding = app.model.onboarding.inProgress;

    var paymentAccount = app.model.paymentAccount;
    this.errorMessages = paymentAccount.errorMessages;
    
    var dataVersion = paymentAccount.newVersion();
    dataVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            dataVersion.pull({ evenIfNewer: true });
            this.formVisible(!dataVersion.version.status());
        }
    }.bind(this));
    
    // Actual data for the form:
    this.paymentAccount = dataVersion.version;

    this.isLocked = paymentAccount.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            app.model.onboarding.inProgress() ?
                'Save and continue' :
                this.isLoading() ? 
                    'loading...' : 
                    this.isSaving() ? 
                        'saving...' : 
                        'Save'
        );
    }, paymentAccount);

    this.discard = function discard() {
        dataVersion.pull({ evenIfNewer: true });
        this.formVisible(!dataVersion.version.status());
        this.userSelectedAccount(null);
    }.bind(this);

    this.save = function save() {
        dataVersion.pushSave()
        .then(function() {
            // Move forward:
            if (app.model.onboarding.inProgress()) {
                app.model.onboarding.goNext();
            } else {
                app.successSave();
            }
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
    
    this.errorMessages = {
        postalCode: ko.observable()
    };
    
    // On change to a valid code, do remote look-up
    createPostalCodeAutolookup({
        appModel: app.model,
        address: this.paymentAccount,
        postalCodeError: this.errorMessages.postalCode
    });
    
    this.formVisible = ko.observable(false);
    this.showForm = function() {
        this.formVisible(true);
    };

    // Null by default, since it represents an immediate selection from the user for current session.
    this.userSelectedAccount = ko.observable(null);
    this.isVenmoAccount = ko.pureComputed(function() {
        // Quick return: on user selection
        if (this.userSelectedAccount()) {
            return this.userSelectedAccount() === 'venmo';
        }
        // On new record, no status, show as 'is bank', so 'false' here:
        if (!this.paymentAccount.status()) return false;
        // If there is no bank data, is Venmo
        return !(this.paymentAccount.accountNumber() && this.paymentAccount.routingNumber());
    }, this);
    this.isBankAccount = ko.pureComputed(function() {
        return !this.isVenmoAccount();
    }, this);

    this.chooseVenmoAccount = function() {
        this.userSelectedAccount('venmo');
    }.bind(this);
    this.chooseBankAccount = function() {
        this.userSelectedAccount('bank');
    }.bind(this);
}
