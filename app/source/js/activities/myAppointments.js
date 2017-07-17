/**
    myAppointments activity
**/
'use strict';

var ko = require('knockout');
var Activity = require('../components/Activity');
var UpcomingAppointmentsSummary = require('../models/UpcomingAppointmentsSummary');
var bookings = require('../data/bookings');

var A = Activity.extend(function MyAppointmentsActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.loggedUser;
    this.navBar = Activity.createSectionNavBar('My appointments');

    this.prepareShowErrorFor = function prepareShowErrorFor(title) {
        return function(err) {
            this.app.modals.showError({
                title: title,
                error: err
            });
        }.bind(this);
    }.bind(this);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.syncUpcomingAppointments();
};

A.prototype.syncUpcomingAppointments = function syncUpcomingAppointments() {
    var v = this.viewModel;

    if (v.upcomingAppointments.items().length) {
        v.upcomingAppointments.isSyncing(true);
    }
    else {
        v.upcomingAppointments.isLoading(true);
    }
    bookings.getUpcomingAppointments()
    .then(function(upcoming) {
        v.upcomingAppointments.model.updateWith(upcoming, true);
    })
    .catch(this.prepareShowErrorFor('Error loading upcoming appointments'))
    .then(function() {
        // Finally
        v.upcomingAppointments.isLoading(false);
        v.upcomingAppointments.isSyncing(false);
    });
};

function ViewModel() {
    this.upcomingAppointments = new UpcomingAppointmentsSummary();
    this.upcomingAppointments.isLoading = ko.observable(false);
    this.upcomingAppointments.isSyncing = ko.observable(false);

    // TODO pastAppointments
    this.pastAppointments = {
        pastAppointments: ko.observable(false),
        count: ko.observable(0)
    };

    // Retrieves a computed that will link to the given named activity adding the current
    // jobTitleID and a mustReturn URL to point this page so its remember the back route
    this.getUrlTo = function(name) {
        // Sample '/clientAppointment/' + jobTitleID()
        return ko.pureComputed(function() {
            return (
                '/' + name + '/' + this.upcomingAppointments.nextBooking.bookingID +'?mustReturn=myAppointments/' + '&returnText=' + ' My appointments'
            );
        }, this);
    };
}
