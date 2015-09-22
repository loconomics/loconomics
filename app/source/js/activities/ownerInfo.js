/**
    OwnerInfo activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function OwnerInfoActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: 'account'
    });
});

exports.init = A.init;
