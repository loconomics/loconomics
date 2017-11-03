/**
    Welcome activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');

var A = Activity.extend(function WelcomeActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;

    this.viewModel = new ViewModel(this.app);

    var serviceProfessionalNavBar = Activity.createSubsectionNavBar(onboarding.navbarTitle(), {
        leftAction: Activity.NavAction.goLogout, helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar(onboarding.navbarTitle(), {
        leftAction: Activity.NavAction.goLogout, helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
    this.title = ko.pureComputed(function() {
        return this.user.firstName() ? 'Welcome, ' + this.user.firstName() + '!' : ' Welcome!';
    }, this.viewModel);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = this.viewModel.user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
        this.navBar.model.updateWith(nav, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.updateNavBarState();
};

function ViewModel() {

    this.isInOnboarding = onboarding.inProgress;
    this.user = user;
    this.isServiceProfessional = user.isServiceProfessional;
    this.helpLinkProfessionals = '/help/relatedArticles/201211855-getting-started';
    this.helpLinkClients = '/help/relatedArticles/201313875-getting-started';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);
    this.startProffesionalOnboarding = function startOnboarding() {
        onboarding.isServiceProfessional(true);
        onboarding.goNext();
    };
    this.startClientOnboarding = function startOnboarding() {
        onboarding.isServiceProfessional(false);
        onboarding.goNext();
    };
}
