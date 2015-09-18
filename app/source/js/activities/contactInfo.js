/**
    ContactInfo activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extends(function ContactInfoActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: 'ownerInfo'
    });
    this.defaultNavBar = this.navBar.model.toPlainObject();
    
    this.registerHandler({
        target: this.app.model.userProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving contact data.' : 'Error loading contact data.';
            this.app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.app.model.homeAddress,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving address details.' : 'Error loading address details.';
            this.app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
        }.bind(this)
    });
    
    // On change to a valid code, do remote look-up
    // NOTE: using directly a computed rather than the registerHandler to use
    // the rateLimit extender that avoids excesive request being performed on changes.
    // NOTE: the code inside the handler is mostly the same as in addressEditor for the same look-up.
    var app = this.app,
        viewModel = this.viewModel;
    ko.computed(function() {
        var postalCode = this.postalCode(),
            address = this;

        if (postalCode && !/^\s*$/.test(postalCode)) {
            app.model.postalCodes.getItem(postalCode)
            .then(function(info) {
                if (info) {
                    address.city(info.city);
                    address.stateProvinceCode(info.stateProvinceCode);
                    address.stateProvinceName(info.stateProvinceName);
                    viewModel.errorMessages.postalCode('');
                }
            })
            .catch(function(err) {
                address.city('');
                address.stateProvinceCode('');
                address.stateProvinceName('');
                // Expected errors, a single message, set
                // on the observable
                var msg = typeof(err) === 'string' ? err : null;
                if (msg || err && err.responseJSON && err.responseJSON.errorMessage) {
                    viewModel.errorMessages.postalCode(msg || err.responseJSON.errorMessage);
                }
                else {
                    // Log to console for debugging purposes, on regular use an error on the
                    // postal code is not critical and can be transparent; if there are 
                    // connectivity or authentification errors will throw on saving the address
                    console.error('Server error validating Zip Code', err);
                }
            });
        }
    }, this.viewModel.address)
    // Avoid excessive requests by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 200, method: 'notifyWhenChangesStop' } });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Discard any previous unsaved edit
    this.viewModel.discard();
    
    this.updateNavBarState();
    
    // Keep data updated:
    this.app.model.userProfile.sync();
    this.app.model.homeAddress.sync();
};

function ViewModel(app) {

    this.headerText = ko.pureComputed(function() {
        return app.model.onboarding.inProgress() ?
            'How can we reach you?' :
            'Contact information';
    });
    
    // List of possible error messages registered
    // by name
    this.errorMessages = {
        postalCode: ko.observable('')
    };
    
    // User Profile
    var userProfile = app.model.userProfile;
    var profileVersion = userProfile.newVersion();
    profileVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            profileVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.profile = profileVersion.version;
    
    // TODO l10n
    this.months = ko.observableArray([
        { id: 1, name: 'January'},
        { id: 2, name: 'February'},
        { id: 3, name: 'March'},
        { id: 4, name: 'April'},
        { id: 5, name: 'May'},
        { id: 6, name: 'June'},
        { id: 7, name: 'July'},
        { id: 8, name: 'August'},
        { id: 9, name: 'September'},
        { id: 10, name: 'October'},
        { id: 11, name: 'November'},
        { id: 12, name: 'December'}
    ]);
    // We need to use a special observable in the form, that will
    // update the back-end profile.birthMonth
    this.selectedBirthMonth = ko.computed({
        read: function() {
            var birthMonth = this.profile.birthMonth();
            return birthMonth ? this.months()[birthMonth - 1] : null;
        },
        write: function(month) {
            this.profile.birthMonth(month && month.id || null);
        },
        owner: this
    });
    
    this.monthDays = ko.observableArray([]);
    for (var iday = 1; iday <= 31; iday++) {
        this.monthDays.push(iday);
    }
    
    // Home Address
    var homeAddress = app.model.homeAddress;
    var homeAddressVersion = homeAddress.newVersion();
    homeAddressVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            homeAddressVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.address = homeAddressVersion.version;

    // Control observables: special because must a mix
    // of the both remote models used in this viewmodel
    this.isLocked = ko.computed(function() {
        return userProfile.isLocked() || homeAddress.isLocked();
    }, this);
    this.isLoading = ko.computed(function() {
        return userProfile.isLoading() || homeAddress.isLoading();
    }, this);
    this.isSaving = ko.computed(function() {
        return userProfile.isSaving() || homeAddress.isSaving();
    }, this);

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
    }, this);
    
    // Actions

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
        homeAddressVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        Promise.all([
            profileVersion.pushSave(),
            homeAddressVersion.pushSave()
        ])
        .then(function() {
            if (app.model.onboarding.inProgress()) {
                app.model.onboarding.goNext();
            }
            else {
                app.successSave();
            }
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
}
