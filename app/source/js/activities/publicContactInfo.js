/**
    publicContactInfo activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');

var A = Activity.extend(function PublicContactInfo() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;

    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: '/listingEditor', helpLink: this.viewModel.helpLink
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
        userProfile.sync();
    };

    this.save = function save() {
        return profileVersion.pushSave()
        .then(function() {
            if (onboarding.inProgress()) {
                onboarding.goNext();
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

