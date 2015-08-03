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
    
    setTestingData(this.viewModel);
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
    
    // TODO Depends on jobTitle:
    this.viewModel.supportGratuity(true);
};

var FreelancerPricingVM = require('../viewmodels/FreelancerPricing');

function ViewModel(app) {
    this.freelancerID = ko.observable(0);
    this.jobTitleID = ko.observable(0);
    this.instantBooking = ko.observable(true);
    this.isLocked = ko.observable(false);
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
    
    this.supportGratuity = ko.observable(false);
    this.gratuity = ko.observable(0);
    
    this.summary = new PricingSummary();
    
    this.makeRepeatBooking = ko.observable(false);
}

var Model = require('../Models/Model');
var numeral = require('numeral');

function PricingSummary(values) {

    Model(this);

    this.model.defProperties({
        items: {
            isArray: true,
            Model: PricingSummaryItem
        },
        feesPercentage: 10
    }, values);

    this.subtotalPrice = ko.pureComputed(function() {
        return this.items().reduce(function(total, item) {
            total += item.price();
            return total;
        }, 0);
    }, this);
    
    this.fees = ko.pureComputed(function() {
        var t = this.subtotalPrice(),
            f = this.feesPercentage();
        return t * (f / 100);
    }, this);

    this.totalPrice = ko.pureComputed(function() {
        return this.subtotalPrice() + this.fees();
    }, this);
    
    this.feesMessage = ko.pureComputed(function() {
        var f = numeral(this.fees()).format('$#,##0.00');
        return '*includes a __fees__ first-time booking fee'.replace(/__fees__/g, f);
    }, this);
}

function PricingSummaryItem(values) {
    
    Model(this);

    this.model.defProperties({
        concept: '',
        price: 0
    }, values);
}

function setTestingData(vw) {
    vw.summary.items([
        new PricingSummaryItem({
            concept: 'Deep Tissue Massage',
            price: 99
        }),
        new PricingSummaryItem({
            concept: 'Special oils',
            price: 15
        }),
        new PricingSummaryItem({
            concept: 'Gratuity (20%)',
            price: 22.8
        })
    ]);
}
