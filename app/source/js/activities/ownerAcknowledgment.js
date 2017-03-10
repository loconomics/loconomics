/**
    Owner Acknowledgment activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function OwnerAcknowledgmentActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.isServiceProfessional;
    this.viewModel = {};
    
    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: '/ownerInfo', helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    });
});

module.exports = A;
