/**
    PrivacySettings activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var user = require('../data/userProfile').data;
var onboarding = require('../data/onboarding');
var privacySettings = require('../data/privacySettings');
var showError = require('../modals/error').show;

var A = Activity.extend(function PrivacySettingsActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;

    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
    this.title('Privacy settings');

    this.registerHandler({
        target: privacySettings,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving privacy settings.' : 'Error loading privacy settings.';
            showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = this.viewModel.user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
        this.navBar.model.updateWith(nav, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Keep data updated:
    privacySettings.sync();
    // Discard any previous unsaved edit
    this.viewModel.discard();

    this.updateNavBarState();
};

function ViewModel(app) {
    this.user = user;
    this.helpLinkProfessionals = '/help/relatedArticles/201967106-protecting-your-privacy';
    this.helpLinkClients = '/help/relatedArticles/201960903-protecting-your-privacy';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);

    var settingsVersion = privacySettings.newVersion();
    settingsVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            settingsVersion.pull({ evenIfNewer: true });
        }
    });

    // Actual data for the form:
    this.settings = settingsVersion.version;

    this.isLocked = privacySettings.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'loading...' :
                this.isSaving() ?
                    'saving...' :
                    'Save'
        );
    }, privacySettings);

    this.discard = function discard() {
        settingsVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        settingsVersion.pushSave()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
}
