/**
    BoardMemberNominations activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var A = Activity.extend(function BoardMemberNominationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel();
    this.navBar = Activity.createSubsectionNavBar('Cooperative', {
        backLink: '/ownerInfo' , helpLink: this.viewModel.helpLink
    });
    this.title('Board nominations');
});

module.exports = A;

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201959913-electing-board-members';
}
