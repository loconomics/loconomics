/**
    UserFees activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function UserFeesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {
        helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    };

    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: '/ownerInfo', helpLink: this.viewModel.helpLink
    });
});

module.exports = A;
