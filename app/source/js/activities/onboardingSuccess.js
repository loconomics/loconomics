/**
    OnboardingSuccess activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function OnboardingSuccessActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    
    var app = this.app;
    
    this.viewModel = {
        userProfile: app.model.userProfile.data,
        isServiceProfessional: app.model.userProfile.data.isServiceProfessional,
        jobTitleName: ''
    };
    
    this.navBar = new Activity.NavBar({
        title: null,
        leftAction: Activity.NavAction.menuIn,
        rightAction: Activity.NavAction.menuNewItem
    });
});

exports.init = A.init;
