/**
    Dashboard activity
**/
'use strict';

var ko = require('knockout');

var Activity = require('../components/Activity'),
    AppointmentView = require('../viewmodels/AppointmentView'),
    UserJobTitle = require('../models/UserJobTitle');

var A = Activity.extend(function DashboardActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    
    // Getting elements
    this.$nextBooking = this.$activity.find('#dashboardNextBooking');
    this.$upcomingBookings = this.$activity.find('#dashboardUpcomingBookings');
    this.$inbox = this.$activity.find('#dashboardInbox');
    this.$performance = this.$activity.find('#dashboardPerformance');
    this.$getMore = this.$activity.find('#dashboardGetMore');
    
    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    var v = this.viewModel,
        app = this.app,
        appModel = this.app.model;
    
    if (this.requestData.completedOnboarding) {
        switch (this.requestData.completedOnboarding) {
            case 'welcome': // Schedule complete
                this.app.modals.showNotification({
                    title: 'Nice work!',
                    message: 'You\'ll now be taken to your dashboard.' +
                        'Please try the following: ' +
                        '1. Activate your marketplace profile ' +
                        '2. Add a fake client using +' +
                        '3. Add a fake booking using +',
                    buttonText: 'Got it'
                });
                break;
        }
    }
    
    var preapareShowErrorFor = function preapareShowErrorFor(title) {
        return function(err) {
            this.app.modals.showError({
                title: title,
                error: err
            });
        }.bind(this);
    }.bind(this);
    
    // Update data
    if (v.upcomingBookings.items().length) {
        v.upcomingBookings.isSyncing(true);
    }
    else {
        v.upcomingBookings.isLoading(true);
    }
    appModel.bookings.getUpcomingBookings()
    .then(function(upcoming) {

        if (upcoming.nextBookingID) {
            var previousID = v.nextBooking() && v.nextBooking().sourceBooking().bookingID();
            if (upcoming.nextBookingID !== previousID) {
                if (v.nextBooking()) {
                    v.nextBooking.isSyncing(true);
                }
                else {
                    v.nextBooking.isLoading(true);
                }
                appModel.calendar.getAppointment({ bookingID: upcoming.nextBookingID })
                .then(function(apt) {
                    v.nextBooking(new AppointmentView(apt, app));
                })
                .catch(preapareShowErrorFor('Error loading next booking'))
                .then(function() {
                    // Finally
                    v.nextBooking.isLoading(false);
                    v.nextBooking.isSyncing(false);
                });
            }
        }
        else {
            v.nextBooking(null);
        }

        v.upcomingBookings.today.quantity(upcoming.today.quantity);
        v.upcomingBookings.today.time(upcoming.today.time && new Date(upcoming.today.time));
        v.upcomingBookings.tomorrow.quantity(upcoming.tomorrow.quantity);
        v.upcomingBookings.tomorrow.time(upcoming.tomorrow.time && new Date(upcoming.tomorrow.time));
        v.upcomingBookings.thisWeek.quantity(upcoming.thisWeek.quantity);
        v.upcomingBookings.thisWeek.time(upcoming.thisWeek.time && new Date(upcoming.thisWeek.time));
        v.upcomingBookings.nextWeek.quantity(upcoming.nextWeek.quantity);
        v.upcomingBookings.nextWeek.time(upcoming.nextWeek.time && new Date(upcoming.nextWeek.time));
    })
    .catch(preapareShowErrorFor('Error loading upcoming bookings'))
    .then(function() {
        // Finally
        v.upcomingBookings.isLoading(false);
        v.upcomingBookings.isSyncing(false);
    });
    
    // Messages
    var MessageView = require('../models/MessageView');
    if (v.inbox.messages().length)
        v.inbox.isSyncing(true);
    else
        v.inbox.isLoading(true);
    appModel.messaging.getList()
    .then(function(threads) {
        v.inbox.messages(threads().map(MessageView.fromThread.bind(null, app)));
    })
    .catch(preapareShowErrorFor('Error loading latest messages'))
    .then(function() {
        // Finally
        v.inbox.isLoading(false);
        v.inbox.isSyncing(false);
    });
    
    this.syncGetMore();
};

A.prototype.syncGetMore = function syncGetMore() {
    // Check the 'profile' alert
    this.app.model.userJobProfile.syncList()
    .then(function(list) {
        var yep = list.some(function(job) {
            if (job.statusID() !== UserJobTitle.status.on)
                return true;
        });
        this.viewModel.getMore.profile(!!yep);
    }.bind(this));
};


var UpcomingBookingsSummary = require('../models/UpcomingBookingsSummary'),
    MailFolder = require('../models/MailFolder'),
    PerformanceSummary = require('../models/PerformanceSummary'),
    GetMore = require('../models/GetMore');

function ViewModel(app) {

    this.upcomingBookings = new UpcomingBookingsSummary();
    this.upcomingBookings.isLoading = ko.observable(false);
    this.upcomingBookings.isSyncing = ko.observable(false);

    this.nextBooking = ko.observable(null);
    this.nextBooking.isLoading = ko.observable(false);
    this.nextBooking.isSyncing = ko.observable(false);
    
    this.inbox = new MailFolder({
        topNumber: 4
    });
    this.inbox.isLoading = ko.observable(false);
    this.inbox.isSyncing = ko.observable(false);
    
    this.performance = new PerformanceSummary();
    
    this.getMore = new GetMore();
    
    this.user = app.model.userProfile.data;
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
