/**
    Welcome activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function WelcomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    
    var app = this.app;
    
    this.viewModel = {
        startOnboarding: function startOnboarding() {
            app.model.onboarding.goNext();
        }
    };
    
    this.navBar = new Activity.NavBar({
        title: null,
        leftAction: Activity.NavAction.goLogout,
        rightAction: null
    });
});

exports.init = A.init;
