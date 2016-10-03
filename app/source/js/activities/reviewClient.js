/**
    Review Service Professional activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function reviewClientActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/scheduling', helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    });
});

module.exports = A;
