/**
    Booking activity
    
    It allows a client to book a freelancer
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function BookingActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Booking');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    
    this.viewModel.freelancerID(params[0] |0);
    this.viewModel.jobTitleID(params[1] |0);
    
    // If there is not a freelancer, redirect to search/home page to pick one
    // TODO Same if the freelancer is not found
    if (this.viewModel.freelancerID() === 0 ||
        this.viewModel.jobTitleID() === 0) {
        this.app.shell.go('/home');
        return;
    }
};

var FreelancerPricingVM = require('../viewmodels/FreelancerPricing');

function ViewModel(app) {
    this.freelancerID = ko.observable(0);
    this.jobTitleID = ko.observable(0);
    this.instantBooking = ko.observable(true);
    this.bookingHeader = ko.pureComputed(function() {
        return this.instantBooking() ? 'Your instant booking' : 'Your booking request';
    }, this);
    
    this.photoUrl = ko.pureComputed(function() {
        return app.model.config.siteUrl + '/en-US/Profile/Photo/' + this.freelancerID();
    }, this);
    
    this.freelancerPricing = new FreelancerPricingVM(app);
    this.jobTitleID.subscribe(this.freelancerPricing.jobTitleID);
    this.freelancerID.subscribe(this.freelancerPricing.freelancerID);
    this.freelancerPricing.isSelectionMode(true);
    //this.freelancerPricing.preSelectedPricing([]);
}
