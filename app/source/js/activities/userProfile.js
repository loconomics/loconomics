/**
    User Profile activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').getData();

var A = Activity.extend(function UserProfileActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = user;
    this.navBar = Activity.createSectionNavBar('Profile');
});

exports.init = A.init;
