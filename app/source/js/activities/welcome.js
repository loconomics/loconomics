/**
    Welcome activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function WelcomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    
    this.viewModel = new ViewModel(this.app);        
    
    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Get started', {
        leftAction: Activity.NavAction.goLogout, helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Get started', {
        leftAction: Activity.NavAction.goLogout, helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
});

exports.init = A.init;

var ko = require('knockout');

function ViewModel(app) {
    
    this.isInOnboarding = app.model.onboarding.inProgress;
    this.user = app.model.userProfile.data;
    this.helpLinkProfessionals = '/help/relatedArticles/201211855-getting-started';
    this.helpLinkClients = '/help/relatedArticles/201313875-getting-started';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);
    this.startOnboarding = function startOnboarding() {
        app.model.onboarding.goNext();
    };
    this.clientOnboarding = function clientOnboarding() {
        // IMPORTANT: right now, there is not an onboarding for client, and the onboarding appmodel
        // takes care of steps only for professionals, so clients has a single onboarding step, this
        // 'welcome' activity. Because of that, once the client choose to 'start' here we just
        // remove the onboarding step to prevent show them this welcome again every time it enters again.
        app.model.onboarding.stepNumber(-1);
        app.model.userProfile.saveOnboardingStep(null);
        // We left the link behind to go wherever is linking (to add here an app.model.shell.go('/')
        // can conflict)
    };
    this.userProfile = app.model.userProfile.data;
    this.isServiceProfessional = app.model.userProfile.data.isServiceProfessional;
}
