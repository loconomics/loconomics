/**
    Account activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function AccountActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = this.app.model.userProfile.data;
    this.navBar = Activity.createSectionNavBar('Account');
});

exports.init = A.init;
