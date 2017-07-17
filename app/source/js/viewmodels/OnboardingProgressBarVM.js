/**
    View Model for the OnboardingProgressBar component
**/
'use strict';

var onboarding = require('../data/onboarding');

module.exports = function OnboardingProgressBarVM() {
    this.isInOnboarding = onboarding.inProgress;
};
