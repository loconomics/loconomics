/**
    Dashboard activity
**/
'use strict';

var ko = require('knockout');

var Activity = require('../components/Activity'),
    AppointmentView = require('../viewmodels/AppointmentView'),
    Appointment = require('../models/Appointment'),
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
    
    this.prepareShowErrorFor = function prepareShowErrorFor(title) {
        return function(err) {
            this.app.modals.showError({
                title: title,
                error: err
            });
        }.bind(this);
    }.bind(this);
    
    // Update data
    if (this.app.model.user().isServiceProfessional()) {
        this.syncUpcomingBookings();
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
    
    this.app.model.messaging.getList()
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
        app = this.app,
        appModel = this.app.model;

    if (v.upcomingBookings.items().length) {
        v.upcomingBookings.isSyncing(true);
    }
    else {
        v.upcomingBookings.isLoading(true);
    }
    appModel.bookings.getUpcomingBookings()
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

A.prototype.syncGetMore = function syncGetMore() {
    // Professional only alerts/to-dos
    if (this.app.model.user().isServiceProfessional()) {
        // Check the 'profile' alert
        this.app.model.userJobProfile.syncList()
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
    GetMore = require('../models/GetMore');

function ViewModel(app) {

    this.upcomingBookings = new UpcomingBookingsSummary();
    this.upcomingBookings.isLoading = ko.observable(false);
    this.upcomingBookings.isSyncing = ko.observable(false);

    this.nextBooking = ko.observable(null);
    
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
