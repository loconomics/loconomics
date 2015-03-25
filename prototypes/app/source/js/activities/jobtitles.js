/**
    Jobtitles activity
**/
'use strict';

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile');

var A = Activity.extends(function JobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new UserJobProfileViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();

    //// Set the job title
    //var jobID = state.route.segments[0] |0;
    //this.viewModel.jobTitleID(jobID);
};
