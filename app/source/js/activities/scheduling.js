/**
    Scheduling activity
**/
'use strict';

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile');

var A = Activity.extends(function SchedulingActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new UserJobProfileViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();
};
