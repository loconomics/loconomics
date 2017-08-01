/**
    OwnerPerks activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function OwnerPerksActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {
        helpLink: '/help/relatedArticles/201973183-owner-perks-and-benefits'
    };

    this.navBar = Activity.createSubsectionNavBar('Cooperative', {
        backLink: '/ownerInfo', helpLink: this.viewModel.helpLink
    });
});

module.exports = A;
