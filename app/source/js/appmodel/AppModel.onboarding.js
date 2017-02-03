/**
    Onboarding tracking information
**/
'use strict';

var OnboardingProgress = require('../viewmodels/OnboardingProgress');
var NavAction = require('../viewmodels/NavAction');
var ko = require('knockout');

exports.create = function create(appModel) {
    
    // Onboarding management and state, initially empty so no progress
    var api = new OnboardingProgress();
    
    api.currentActivity = ko.observable('');
    
    // Requires initialization to receive and app instance
    api.init = function init(app) {
        api.app = app;
        api.currentActivity(app.shell.currentRoute.name);
        app.shell.on(app.shell.events.itemReady, function() {
            api.currentActivity(app.shell.currentRoute.name);
        });
    };

    // Extended with new methods

    // Set the correct onboarding progress and step given a step name
    // (usually from database)
    api.setStep = function(stepName) {
        if (this.setStepByName(stepName)) {
            return true;
        }

        // No progress:
        this.model.reset();
        return false;
    };

    api.skipToAddJobTitles = function() {
        this.setStep(OnboardingProgress.steps.names[1]);
    };

    // Update the given navbar with the current onboarding information (only if in progress)
    api.updateNavBar = function(navBar) {
        var yep = this.inProgress();
        if (yep) {
            navBar.leftAction(NavAction.menuIn);
            navBar.title('Get Started');
        }
        return yep;
    };

    api.goCurrentStep = function() {
        // Go current step of onboarding, and if no one, go to dashboard
        var url = this.inProgress() ? this.stepUrl() : 'dashboard';
        this.app.shell.go(url);
    };

    api.goNext = function goNext() {
        var url;

        if(this.isAtCurrentStep()) {
            this.incrementStep();
            appModel.userProfile.saveOnboardingStep(this.stepName());

            url = this.isFinished() ? '/onboardingSuccess' : this.stepUrl();
        }
        else {
            url = this.stepAfter(api.currentActivity()).stepUrl();
        }

        this.app.shell.go(url);
    };

    api.isAtCurrentStep = ko.computed(function() {
        return api.currentActivity() === api.stepName();
    });

    /**
        Check if onboarding is enabled on the user profile
        and redirects to the current step, or do nothing.
    **/
    api.goIfEnabled = function() {
        if (this.inProgress() && !api.isAtCurrentStep()) {
            // Go to the step URL if we are NOT already there, by checking name to
            // not overwrite additional details, like a jobTitleID at the URL
            api.app.shell.go(api.stepUrl());
        }

        return this.inProgress();
    };
    
    return api;
};
