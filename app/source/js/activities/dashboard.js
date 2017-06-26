/**
    Dashboard activity
**/
'use strict';

var ko = require('knockout');

var Activity = require('../components/Activity'),
    AppointmentView = require('../viewmodels/AppointmentView'),
    Appointment = require('../models/Appointment'),
    UserJobTitle = require('../models/UserJobTitle');
var PublicUser = require('../models/PublicUser');
var user = require('../data/userProfile').data;
var bookings = require('../data/bookings');
var users = require('../data/users');
var messaging = require('../data/messaging');
var userJobProfile = require('../data/userJobProfile');

var A = Activity.extend(function DashboardActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel();
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);

    // Getting elements
    //this.$nextBooking = this.$activity.find('#dashboardNextBooking');
    //this.$upcomingBookings = this.$activity.find('#dashboardUpcomingBookings');
    //this.$inbox = this.$activity.find('#dashboardInbox');
    //this.$performance = this.$activity.find('#dashboardPerformance');
    //this.$getMore = this.$activity.find('#dashboardGetMore');

    this.prepareShowErrorFor = function prepareShowErrorFor(title) {
        return function(err) {
            this.app.modals.showError({
                title: title,
                error: err
            });
        }.bind(this);
    }.bind(this);

    this.getUserData = function(userID, jobTitleID) {
        return users.getUser(userID)
        .then(function(info) {
            info.selectedJobTitleID = jobTitleID;
            return new PublicUser(info);
        }.bind(this));
    };

    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Update data
    if (user.isServiceProfessional()) {
        this.syncUpcomingBookings();
    }
    if (user.isClient()) {
        this.syncUpcomingAppointments();
    }
    this.syncMessages();
    this.syncGetMore();
};

A.prototype.syncMessages = function syncMessages() {
    var v = this.viewModel;
    var app = this.app;

    var MessageView = require('../models/MessageView');
    if (v.inbox.messages().length)
        v.inbox.isSyncing(true);
    else
        v.inbox.isLoading(true);

    messaging.getList()
    .then(function(threads) {
        v.inbox.messages(threads().map(MessageView.fromThread.bind(null, app)));
    })
    .catch(this.prepareShowErrorFor('Error loading latest messages'))
    .then(function() {
        // Finally
        v.inbox.isLoading(false);
        v.inbox.isSyncing(false);
    });
};

A.prototype.syncUpcomingBookings = function syncUpcomingBookings() {
    var v = this.viewModel,
        app = this.app;

    if (v.upcomingBookings.items().length) {
        v.upcomingBookings.isSyncing(true);
    }
    else {
        v.upcomingBookings.isLoading(true);
    }
    bookings.getUpcomingBookings()
    .then(function(upcoming) {

        v.upcomingBookings.model.updateWith(upcoming, true);
        var b = v.upcomingBookings.nextBooking();

        if (b) {
            v.nextBooking(new AppointmentView(Appointment.fromBooking(b), app));
        }
        else {
            v.nextBooking(null);
        }

    }.bind(this))
    .catch(this.prepareShowErrorFor('Error loading upcoming bookings'))
    .then(function() {
        // Finally
        v.upcomingBookings.isLoading(false);
        v.upcomingBookings.isSyncing(false);
    });
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

        if (upcoming.nextBooking) {
            return this.getUserData(upcoming.nextBooking.serviceProfessionalUserID, upcoming.nextBooking.jobTitleID);
        }
        return null;
    }.bind(this))
    .then(function(user) {
        v.nextAppointmentServiceProfessionalInfo(user);
    })
    .catch(this.prepareShowErrorFor('Error loading upcoming appointments'))
    .then(function() {
        // Finally
        v.upcomingAppointments.isLoading(false);
        v.upcomingAppointments.isSyncing(false);
    });
};

A.prototype.syncGetMore = function syncGetMore() {
    // Professional only alerts/to-dos
    if (user.isServiceProfessional()) {
        // Check the 'profile' alert
        userJobProfile.syncList()
        .then(function(list) {
            var yep = list.some(function(job) {
                if (job.statusID() !== UserJobTitle.status.on)
                    return true;
            });
            this.viewModel.getMore.profile(!!yep);
        }.bind(this));
    }
};


var UpcomingBookingsSummary = require('../models/UpcomingBookingsSummary'),
    MailFolder = require('../models/MailFolder'),
    PerformanceSummary = require('../models/PerformanceSummary'),
    GetMore = require('../models/GetMore'),
    UpcomingAppointmentsSummary = require('../models/UpcomingAppointmentsSummary');

function ViewModel() {

    this.upcomingBookings = new UpcomingBookingsSummary();
    this.upcomingBookings.isLoading = ko.observable(false);
    this.upcomingBookings.isSyncing = ko.observable(false);

    this.upcomingAppointments = new UpcomingAppointmentsSummary();
    this.upcomingAppointments.isLoading = ko.observable(false);
    this.upcomingAppointments.isSyncing = ko.observable(false);

    this.nextAppointmentServiceProfessionalInfo = ko.observable(null);

    this.nextBooking = ko.observable(null);

    this.inbox = new MailFolder({
        topNumber: 4
    });
    this.inbox.isLoading = ko.observable(false);
    this.inbox.isSyncing = ko.observable(false);

    this.performance = new PerformanceSummary();

    this.getMore = new GetMore();

    this.user = user;

    this.getMapUrlFor = function(address) {
        var lat = ko.unwrap(address.latitude);
        var lng = ko.unwrap(address.longitude);
        //var name = ko.unwrap(address.addressName);
        var place = address.singleLine ? address.singleLine() : '';
        return 'https://www.google.com/maps/?q=' + encodeURIComponent(lat) + ',' + encodeURIComponent(lng) + '&near=' + encodeURIComponent(place) + '&z=16';
    };

    // Retrieves a computed that will link to the given named activity adding the current
    // jobTitleID and a mustReturn URL to point this page so its remember the back route
    this.getUrlTo = function(name) {
        // Sample '/clientAppointment/' + jobTitleID()
        return ko.pureComputed(function() {
            return (
                '/' + name + '/' + this.upcomingAppointments.nextBooking.bookingID +'?mustReturn=/dashboard/' + '&returnText=' + ' Dashboard'
            );
        }, this);
    };
}

/** TESTING DATA **/
function setSomeTestingData(viewModel) {

    //viewModel.performance.earnings.currentAmount(2400);
    //viewModel.performance.earnings.nextAmount(6200.54);
    //viewModel.performance.timeBooked.percent(0.93);

    var moreData = {};
    if (viewModel.user.isServiceProfessional()) {
        moreData = {
            availability: false,
            payments: false,
            profile: false,
            coop: false
        };
    }
    else {
        moreData = {
            availability: false,
            payments: false,
            profile: false,
            coop: true
        };
    }
    viewModel.getMore.model.updateWith(moreData);
}
