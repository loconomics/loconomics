/**
    UserFees activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extends(function UserFeesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: 'ownerInfo'
    });
});

module.exports = A;
