/**
    Account activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').data;
var userPaymentPlan = require('../data/userPaymentPlan');

var A = Activity.extend(function AccountActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Account');
});

exports.init = A.init;

A.prototype.show = function show(state) {

    Activity.prototype.show.call(this, state);

    // Load active plan, if any
    userPaymentPlan.sync();
};

function ViewModel(app) {
    this.isServiceProfessional = user.isServiceProfessional;
    this.activeUserPaymentPlan = userPaymentPlan.data;
}
