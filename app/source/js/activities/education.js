/**
    Education activity
**/
'use strict';

var Activity = require('../components/Activity');
var education = require('../data/education');

var A = Activity.extend(function EducationActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Profile', {
        backLink: '/userProfile' , helpLink: this.viewModel.helpLink
    });
    this.title('Education');
    // Share navBar with desktop nav through viewModel
    this.viewModel.navBar = this.navBar;
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Request a sync and catch any error
    education.sync()
    .catch(function (err) {
        this.app.modals.showError({
            title: 'Error loading education information',
            error: err
        });
    }.bind(this));
};

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201960833-adding-education-to-your-profile';

    this.isLoading = education.state.isLoading;
    this.isSyncing = education.state.isSyncing;

    this.list = education.list;
}
