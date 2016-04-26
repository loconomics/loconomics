/**
    OwnerPerks activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function OwnerPerksActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    
    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: '/ownerInfo', helpLink: '/help/sections/201973183-owner-perks-and-benefits'
    });
});

module.exports = A;
