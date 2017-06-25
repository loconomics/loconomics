/**
 * Onboarding tracking information
 */
// TODO store-jsdocs
'use strict';

var OnboardingProgress = require('../viewmodels/OnboardingProgress');
var NavAction = require('../viewmodels/NavAction');
var ko = require('knockout');
var userProfile = require('./userProfile');
var local = require('./drivers/localforage');

var NAVBAR_TITLE = 'Create your first listing';

// Onboarding management and state, initially empty so no progress
module.exports = new OnboardingProgress();

exports.navbarTitle = function() {
    return NAVBAR_TITLE;
};

exports.currentActivity = ko.observable('');

// Requires initialization to receive and app instance
// TODO: Rething to refactor this; will require decoupling app.shell
exports.init = function init(app) {
    exports.app = app;
    exports.currentActivity(app.shell.currentRoute.name);
    app.shell.on(app.shell.events.itemReady, function() {
        exports.currentActivity(app.shell.currentRoute.name);
    });
};

// Extended with new methods

// Set the correct onboarding progress and step given a step name
// (usually from database)
exports.setStep = function(stepName) {
    if (this.setStepByName(stepName)) {
        return true;
    }

    // No progress:
    this.model.reset();
    return false;
};

exports.skipToAddJobTitles = function() {
    this.setStep(OnboardingProgress.steps.names[1]);
};

// Update the given navbar with the current onboarding information (only if in progress)
exports.updateNavBar = function(navBar) {
    var yep = this.inProgress();
    if (yep) {
        navBar.leftAction(NavAction.menuIn);
        navBar.title(exports.navbarTitle());
    }
    return yep;
};

exports.goCurrentStep = function() {
    // Go current step of onboarding, and if no one, go to dashboard
    var url = this.inProgress() ? this.stepUrl() : 'dashboard';
    this.app.shell.go(url);
};

exports.goNext = function goNext() {
    var url;

    if(this.isAtCurrentStep()) {
        this.incrementStep();
        userProfile.saveOnboardingStep(this.stepName());

        url = this.isFinished() ? '/onboardingSuccess' : this.stepUrl();
    }
    else {
        url = this.stepAfter(exports.currentActivity()).stepUrl();
    }

    // replaceState flag is true, preventing browser back button to move between onboarding steps
    this.app.shell.go(url, null, true);
};

exports.isAtCurrentStep = ko.computed(function() {
    return exports.currentActivity() === exports.stepName();
});

/**
    Check if onboarding is enabled on the user profile
    and redirects to the current step, or do nothing.
**/
exports.goIfEnabled = function() {
    if (this.inProgress() && !exports.isAtCurrentStep()) {
        // Go to the step URL if we are NOT already there, by checking name to
        // not overwrite additional details, like a jobTitleID at the URL
        exports.app.shell.go(exports.stepUrl());
    }

    return this.inProgress();
};

/// Workaround for #374:
/// Local copy of the onboarding selectedJobTitleID, returned by
/// login/signup API as onboardingJobTitleID, to be able to
/// resume onboarding with the correct jobTitle, fixing #374
/// NOTE: I think is a workaround that needs a better solution through a
/// refactor just to make the code more readable and clear, but still
/// works perfect for the case.
var LOCAL_JOBTITLEID_KEY = 'onboardingJobTitleID';
/**
 * Store local copy of the ID to allow for resuming.
 * @private
 * @param {number} jobTitleID
 * @returns {Promise}
 */
var persistLocalJobTitleID = function(jobTitleID) {
    return local.setItem(LOCAL_JOBTITLEID_KEY, jobTitleID);
};
/**
 * Get local copy of the ID for resuming onboarding.
 * @private
 * @returns {Promise<number>}
 */
var getLocalJobTitleID = function() {
    return local.getItem(LOCAL_JOBTITLEID_KEY);
};
// At any point that selected job title ID is changed, we persist it
exports.selectedJobTitleID.subscribe(persistLocalJobTitleID);
/**
 * Request to recover the selectedJobTitleID value from local store.
 * When this ends, the value is in place, ready to resume onboarding.
 * @returns {Promise<int>} A copy of the jobTitleID
 */
exports.recoverLocalJobTitleID = function() {
    return getLocalJobTitleID().then(function(id) {
        exports.selectedJobTitleID(id);
        return id;
    });
};
