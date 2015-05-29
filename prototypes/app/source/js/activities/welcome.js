/**
    Welcome activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function WelcomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    var app = this.app;
    
    this.viewModel = {
        startOnboarding: function startOnboarding() {
            app.model.onboarding.goNext(app);
        }
    };
    
    // No navbar, is empty with auto logo
});

exports.init = A.init;
