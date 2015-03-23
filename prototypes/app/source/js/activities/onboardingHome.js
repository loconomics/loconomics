/**
    OnboardingHome activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function OnboardingHomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;
