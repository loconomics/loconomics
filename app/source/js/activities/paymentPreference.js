/**
    Professionals Payment Preference activity
**/
'use strict';

var Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
require('../kocomponents/payout/preference-view');

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
    // Using activity.isShown to enable components at the template,
    // their set-up is simplified by being re-created every time the
    // activity is displayed and disposed when hidden (this prevents from
    // needing reset/discard/show-hide-detection logics at component level;
    // they does init at constructor and implement 'dispose' method).
    this.viewModel.isShown = this.isShown;
});

exports.init = A.init;

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';
    this.isInOnboarding = onboarding.inProgress;
}
