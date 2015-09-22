/**
    Account activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function AccountActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSectionNavBar('Account');
});

exports.init = A.init;
