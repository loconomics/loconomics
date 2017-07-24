/**
    PaymentAcount activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var PostalCodeVM = require('../viewmodels/PostalCode');
var onboarding = require('../data/onboarding');
var paymentAccount = require('../data/paymentAccount');

var A = Activity.extend(function PaymentAccountActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: this.viewModel.helpLink
    });
    // Share navBar with desktop nav through viewModel
    this.viewModel.navBar = this.navBar;

    this.defaultNavBar = this.navBar.model.toPlainObject(true);

    this.registerHandler({
        target: paymentAccount,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Unable to save your payment account.' : 'Unable to load your payment account.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
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
    paymentAccount.sync();
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';

    this.isInOnboarding = onboarding.inProgress;

    /**
     * Sets if the form must reduce the number of fields.
     * This is enabled automatically if we are in onboarding
     * (change is observed, and is set too at the 'discard' method).
     * Additionally, the value switchs off if an error is throw on saving,
     * letting the user to fix any error at hidden fields (#196)
     */
    this.simplifiedFormEnabled = ko.observable(false);
    this.isInOnboarding.subscribe(function (itIs) {
        this.simplifiedFormEnabled(itIs);
    }.bind(this));

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
            onboarding.inProgress() ?
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
        this.simplifiedFormEnabled(this.isInOnboarding());
    }.bind(this);

    this.save = function save() {
        // If clicking 'save and continue' and no form visible
        // just skip saving:
        // is at onboarding, user has added payment info already and didn't
        // want to edit it. This allows to skip some buggy situations #196
        if (this.isInOnboarding() &&
            dataVersion.version.status() &&
            !this.formVisible()) {
            onboarding.goNext();
        }
        else {
            // Save
            dataVersion.pushSave()
            .then(function() {
                // Move forward:
                if (onboarding.inProgress()) {
                    onboarding.goNext();
                } else {
                    app.successSave();
                }
            }.bind(this))
            .catch(function() {
                // Show all fields, letting user to fix error in previously
                // hidden fields.
                this.simplifiedFormEnabled(false);
                // catch error, managed on event
            }.bind(this));
        }
    }.bind(this);

    this.onSkip = function() {
        app.model.onboarding.goNext();
    }.bind(this);

    this.errorMessages = {
        postalCode: ko.observable()
    };

    // On change to a valid code, do remote look-up
    this.postalCodeVM = new PostalCodeVM({
        address: this.paymentAccount,
        postalCodeError: this.errorMessages.postalCode
    });

    // Postal code VM needs to know when the form data has loaded
    paymentAccount.isLoading.subscribe(function(isLoading) {
        if(!isLoading) {
            this.postalCodeVM.onFormLoaded();
        }
    }, this);

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
