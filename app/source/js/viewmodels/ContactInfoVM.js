'use strict';
var ko = require('knockout'),
    PostalCodeVM = require('../viewmodels/PostalCode');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');
var homeAddress = require('../data/homeAddress');

module.exports = function ContactInfoVM() {

    this.user = user;

    this.headerText = ko.pureComputed(function() {
        return onboarding.inProgress() ?
            'How can we reach you?' :
            'Contact information';
    });

    // List of possible error messages registered
    // by name
    this.errorMessages = {
        postalCode: ko.observable('')
    };

    // User Profile
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

    // On change to a valid code, do remote look-up
    this.postalCodeVM = new PostalCodeVM({
        address: this.address, // assumption: address will never change
        postalCodeError: this.errorMessages.postalCode
    });

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

    this.isLoading.subscribe(function(isLoading) {
        if(!isLoading) {
            this.postalCodeVM.onFormLoaded();
        }
    }, this);

    // Actions

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
        homeAddressVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.sync = function sync() {
        userProfile.sync();
        homeAddress.sync();
    };

    this.save = function save() {
        return Promise.all([
            profileVersion.pushSave(),
            homeAddressVersion.pushSave()
        ]);
    }.bind(this);
};
