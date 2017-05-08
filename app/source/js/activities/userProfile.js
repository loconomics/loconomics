/**
    User Profile activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function UserProfileActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = this.app.model.userProfile.data;
    this.navBar = Activity.createSectionNavBar('Profile');
});

exports.init = A.init;
