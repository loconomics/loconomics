/**
    OwnerInfo activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function OwnerInfoActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: 'account'
    });
});

exports.init = A.init;

function ViewModel() {
    this.ownerStatus = ko.observable('pending');
    this.ownerStatusName = ko.observable('Pending');
    this.ownerStatusOK = ko.pureComputed(function() {
        return this.ownerStatus() === 'active';
    }, this);
}
