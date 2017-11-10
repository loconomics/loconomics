/**
    publicContactInfo activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');
var countriesOptions = require('../viewmodels/CountriesOptions');
var phoneValidationRegex = require('../utils/phoneValidationRegex');
var showError = require('../modals/error').show;

var A = Activity.extend(function PublicContactInfo() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;

    // Defaults settings for navBar.
    var backLink = user.isServiceProfessional() ? '/listingEditor' : '/userProfile';
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: backLink, helpLink: this.viewModel.helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        return ' Your contact info';
    }, this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    onboarding.updateNavBar(this.navBar);

    // Discard any previous unsaved edit
    this.viewModel.discard();

    // Keep data updated:
    this.viewModel.sync();
};

function ViewModel(app) {

    this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    this.isServiceProfessional = user.isServiceProfessional;
    this.isInOnboarding = onboarding.inProgress;

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

    this.submitText = ko.pureComputed(function() {
        return (
            onboarding.inProgress() ?
                'Save and continue' :
                this.isSaving() ?
                    'Saving...' :
                    'Save'
        );
    }, this);

    // Validations
    this.isFirstNameValid = ko.pureComputed(function() {
        // \p{L} the Unicode Characterset not supported by JS
        var firstNameRegex = /^(\S{2,}\s*)+$/;
        return firstNameRegex.test(this.profile.firstName());
    }, this);
    this.isLastNameValid = ko.pureComputed(function() {
        var lastNameRegex = /^(\S{2,}\s*)+$/;
        return lastNameRegex.test(this.profile.lastName());
    }, this);
    this.isPhoneValid = ko.pureComputed(function() {
        var isUSA = this.profile.countryID() === countriesOptions.unitedStates.id;
        var phoneRegex = isUSA ? phoneValidationRegex.NORTH_AMERICA_PATTERN : phoneValidationRegex.GENERAL_VALID_CHARS;
        return phoneRegex.test(this.profile.phone());
    }, this);
    this.isFormValidated = ko.observable(false);
    /**
     * @typedef {Object} ValidationErrorsDictionary
     * @property {Array<string>} FieldKey Every property matches a field name and
     * contains all errors for it, then there is not a list of properties since
     * is dynamic
     */
    /**
     * @typedef BadRequesResult
     * @property {string} errorMessage
     * @property {string} errorSource
     * @property {Array<ValidationErrorsDictionary>} errors
     */
    /**
     * Checks validation rules for each field, returning the list of errors
     * per field in the same format as a server 'Bad Request' or null if success
     * @returns {BadRequestResult}
     */
    this.validate = function() {
        var errors = {};
        if (!this.isFirstNameValid()) {
            errors.firstName = 'First name is two short';
        }
        if (!this.isLastNameValid()) {
            errors.lastName = 'Last name is too short';
        }
        if (!this.isPhoneValid()) {
            errors.phone = this.profile.phone() ? 'Given phone is not valid' : 'Phone is required';
        }
        this.isFormValidated(true);
        if (Object.keys(errors).length === 0) {
            return null;
        }
        else {
            return {
                errorMessage: 'Please fix these issues and try again:',
                errorSource: 'validation',
                errors: errors
            };
        }
    };

    // States
    this.isLoading = userProfile.isLoading;
    this.isSaving = userProfile.isSaving;
    this.isSyncing = userProfile.isSyncing;
    this.isLocked = userProfile.isLocked;

    // Actions

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.sync = function sync() {
        return userProfile.load()
        .catch(function(err) {
            return showError({
                title: 'Unable to load your contact info',
                error: err
            });
        });
    };

    this.save = function save() {
        var errors = this.validate();
        if (!errors) {
            return profileVersion.pushSave()
            .then(function() {
                if (onboarding.inProgress()) {
                    onboarding.goNext();
                }
                else {
                    app.successSave();
                }
            })
            .catch(function(err) {
                return showError({
                    title: 'Unable to save your contact info',
                    error: err
                });
            });
        }
        else {
            return showError({
                title: 'Unable to save your contact info',
                error: errors
            });
        }
    }.bind(this);
}

