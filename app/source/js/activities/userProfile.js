/**
    User Profile activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').data;

var A = Activity.extend(function UserProfileActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = user;
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;
