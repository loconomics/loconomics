/**
    View Model for the OnboardingProgressBar component
**/
'use strict';

module.exports = function OnboardingProgressBarVM(app) {
    this.isInOnboarding = app.model.onboarding.inProgress;
};
