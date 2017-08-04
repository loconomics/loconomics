/**
    Professionals Payment Preference activity
**/
'use strict';

var Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
require('../kocomponents/payment-preference-view');

var A = Activity.extend(function PaymentPreferenceActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account',
        helpLink: this.viewModel.helpLink
    });
    // Share navBar with desktop nav through viewModel
    this.viewModel.navBar = this.navBar;
});

exports.init = A.init;

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';
    this.isInOnboarding = onboarding.inProgress;
}
