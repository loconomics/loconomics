/**
    Client Appointment activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function ClientAppointmentActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel();
    // TODO Customize navbar per design
    this.navBar = Activity.createSectionNavBar('Upcoming');
});

exports.init = A.init;

function ViewModel() {
    this.appointments = ko.observableArray([]);
    
    this.currentIndex = ko.observable(0);
    
    this.currentAppointment = ko.pureComputed(function() {
        return this.appointments()[this.currentIndex()];
    }, this);
}
