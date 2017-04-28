/**
 * Landing page activity. This is meant to be used within landing pages, not with in the app.
 *
 * @exports a landing page activity, which extends components/Activity
 **/
'use strict';

var Activity = require('../components/Activity'),
    SignupVM = require('../viewmodels/Signup');

var A = Activity.extend(function LandingPageActivity() {
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);


    /*this.registerHandler({
        target: this.viewModel.signup,
        event: 'signedup',
        handler: function() {
            redirectLoggedUser();
        }.bind(this)
    });*/

});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
};

var ko = require('knockout');
function ViewModel(app) {
    this.signup = ko.observable();// new SignupVM(app);

    /**
     * Navigate to onboarding or dashboard.
     * It's a simplified and adapted version of app.goDashboard that
     * uses internally onboarding.goIfEnabled. Both this cannot be
     * used in this context since we have not a full shell here and
     * we need to do a real browser redirect that will load the
     * full webapp at the expected URL/activity.
     */
    this.redirectLoggedUser = function() {
        // Default URL to home
        var url = '/';
        // Try getting onboarding URL
        var onboardingUrl = app.model.onboarding.stepUrl();
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

    this.signup.subscribe(function (signup) {
        if (signup) {
            signup.profile(SignupVM.profileType.serviceProfessional);
            signup.isCountryVisible(false);
            signup.on('signedup', function(/*signedupData*/) {
                this.redirectLoggedUser();
            }.bind(this));
        }
    }.bind(this));
}
