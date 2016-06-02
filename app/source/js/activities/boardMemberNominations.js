/**
    BoardMemberNominations activity
**/
'use strict';

var Activity = require('../components/Activity');
var A = Activity.extend(function BoardMemberNominationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: '/ownerInfo' , helpLink: '/help/relatedArticles/201959913-electing-board-members'
    });
});

module.exports = A;
