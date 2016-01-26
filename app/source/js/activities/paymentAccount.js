/**
    PaymentAcount activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function PaymentAccountActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile'
    });
    
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

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Discard any previous unsaved edit
    this.viewModel.discard();
    // Keep data updated:
    this.app.model.paymentAccount.sync();
};

function ViewModel(app) {

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
            if (dataVersion.version.status()) {
                this.formVisible(false);
            }
        }
    }.bind(this));
    
    // Actual data for the form:
    this.paymentAccount = dataVersion.version;

    this.isLocked = paymentAccount.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, paymentAccount);

    this.discard = function discard() {
        dataVersion.pull({ evenIfNewer: true });
        this.formVisible(false);
    }.bind(this);

    this.save = function save() {
        dataVersion.pushSave()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
    
    this.errorMessages = {
        postalCode: ko.observable()
    };
    
    // On change to a valid code, do remote look-up
    var postalError = this.errorMessages.postalCode;
    ko.computed(function() {
        if (!paymentAccount.isLoading()) {
            var postalCode = this.postalCode();
            if (postalCode && !/^\s*$/.test(postalCode)) {
                app.model.postalCodes.getItem(postalCode)
                .then(function(info) {
                    if (info) {
                        this.city(info.city);
                        this.stateProvinceCode(info.stateProvinceCode);
                        postalError('');
                    }
                }.bind(this))
                .catch(function(err) {
                    this.city('');
                    this.stateProvinceCode('');
                    // Expected errors, a single message, set
                    // on the observable
                    var msg = typeof(err) === 'string' ? err : null;
                    if (msg || err && err.responseJSON && err.responseJSON.errorMessage) {
                        postalError(msg || err.responseJSON.errorMessage);
                    }
                    else {
                        // Log to console for debugging purposes, on regular use an error on the
                        // postal code is not critical and can be transparent; if there are 
                        // connectivity or authentification errors will throw on saving the address
                        console.error('Server error validating Postal Code', err);
                    }
                }.bind(this));
            }
        }
    }, this.paymentAccount)
    // Avoid excessive requests by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 60, method: 'notifyWhenChangesStop' } });
    
    this.formVisible = ko.observable(false);
    this.showForm = function() {
        this.formVisible(true);
    };
}
