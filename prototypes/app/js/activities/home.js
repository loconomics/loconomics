/**
    Home activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');

var singleton = null;

exports.init = function initHome($activity, options, app) {

    if (singleton === null)
        singleton = new HomeActivity($activity, app);
    
    singleton.show(options);
};

function HomeActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.$nextBooking = $activity.find('#homeNextBooking');
    this.$upcomingBookings = $activity.find('#homeUpcomingBookings');
    this.$inbox = $activity.find('#homeInbox');
    this.$performance = $activity.find('#homePerformance');
    this.$getMore = $activity.find('#homeGetMore');

    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    this.dataView.nextBooking(require('../testdata/calendarAppointments').appointments[0]);
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
}

HomeActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
};

var Appointment = require('../models/Appointment');

function ViewModel() {

    // ...
    this.upcomingBookings = ko.observableArray([]);

    // :Appointment
    this.nextBooking = ko.observable(null);
}

