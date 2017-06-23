/**
    OnboardingSuccess activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').getData();

var A = Activity.extend(function OnboardingSuccessActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;

    this.viewModel = {
        userProfile: user,
        isServiceProfessional: user.isServiceProfessional,
        jobTitleName: ''
    };

    this.navBar = new Activity.NavBar({
        title: null,
        leftAction: Activity.NavAction.menuIn,
        rightAction: Activity.NavAction.menuNewItem
    });
});

exports.init = A.init;
