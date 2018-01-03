/**
 * Landing page activity. This is meant to be used within landing pages, not with in the app.
 *
 * @exports a landing page activity, which extends components/Activity
 **/
'use strict';

var Activity = require('../components/Activity');
var SignupVM = require('../viewmodels/Signup');
var onboarding = require('../data/onboarding');

var A = Activity.extend(function LandingPageActivity() {
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();
});

exports.init = A.init;

function ViewModel() {
    /**
     * Navigate to onboarding or dashboard.
     * It's a simplified and adapted version of app.goDashboard that
     * uses internally onboarding.goIfEnabled. Both this cannot be
     * used in this context since we have not a full shell here and
     * we need to do a real browser redirect that will load the
     * full webapp at the expected URL/activity.
     */
    this.redirect = function(/*signedupData*/) {
        // Default URL to home
        var url = '/';
        // Try getting onboarding URL
        var onboardingUrl = onboarding.stepUrl();
        if(onboardingUrl) {
            url = '/#!' + onboardingUrl;
        }
        else {
            // Go dashboard when no onboarding
            url = '/#!/dashboard';
        }
        // Perform redirect
        window.location.href = url;
    };

    this.profile = SignupVM.profileType.serviceProfessional;
}
