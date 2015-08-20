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
    
    // Only on change (not first time), when choosed the option 'custom'
    // from gratuity, focus the textbox to input the custom value
    this.viewModel.presetGratuity.subscribe(function(preset) {
        if (preset === 'custom') {
            // Small delay to allow the binding to display the custom field,
            // the UI to update, and then focus it; trying to do it without
            // timeout will do nothing.
            setTimeout(function() {
                this.$activity.find('[name=custom-gratuity]').focus();
            }.bind(this), 50);
        }
    }.bind(this));
    
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

var FreelancerPricingVM = require('../viewmodels/FreelancerPricing'),
    BookingProgress = require('../viewmodels/BookingProgress');

var bookingRequestSteps = [
    'services',
    'selectLocation',
    'selectTimes',
    'payment',
    'confirm'
];
var instantBookingSteps = [
    'services',
    'selectLocation',
    'selectTime', // <- This is different
    'payment',
    'confirm'
];

// L18N
var stepsLabels = {
    services: 'Services',
    selectLocation: 'Select a location',
    selectTimes: 'Select preferred times',
    selectTime: 'Select the time',
    payment: 'Payment',
    confirm: 'Confirm'
};

function ViewModel(app) {
    //jshint maxstatements:40
    
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
    
    this.progress = new BookingProgress();
    
    ko.computed(function() {
        this.progress.stepsList(this.instantBooking() ? instantBookingSteps : bookingRequestSteps);
    }, this);
    
    this.freelancerPricing = new FreelancerPricingVM(app);
    this.jobTitleID.subscribe(this.freelancerPricing.jobTitleID);
    this.freelancerID.subscribe(this.freelancerPricing.freelancerID);
    this.freelancerPricing.isSelectionMode(true);
    //this.freelancerPricing.preSelectedPricing([]);
    
    this.supportGratuity = ko.observable(false);
    this.customGratuity = ko.observable(0);
    this.presetGratuity = ko.observable(0);
    this.gratuityAmount = ko.observable(0);
    this.gratuityPercentage = ko.pureComputed(function() {
        var preset = this.presetGratuity();
        if (preset === 'custom')
            return 0;
        else
            return preset;
    }, this);

    this.summary = new PricingSummary();
    this.gratuityPercentage.subscribe(this.summary.gratuityPercentage);
    this.gratuityAmount.subscribe(this.summary.gratuityAmount);
    
    this.makeRepeatBooking = ko.observable(false);
    this.promotionalCode = ko.observable('');
    
    this.nextStep = function() {
        this.progress.next();
    };
    
    this.goStep = function(stepName) {
        var i = this.progress.stepsList().indexOf(stepName);
        this.progress.step(i > -1 ? i : 0);
    };

    this.getStepLabel = function(stepName) {
        return stepsLabels[stepName] || stepName;
    };
    
    this.save = function() {
        // TODO Final step, confirm and save booking
    };
}

var Model = require('../Models/Model');
var numeral = require('numeral');

function PricingSummaryItem(values) {
    
    Model(this);

    this.model.defProperties({
        concept: '',
        price: 0
    }, values);
}

function PricingSummary(values) {

    Model(this);

    this.model.defProperties({
        pricingItems: {
            isArray: true,
            Model: PricingSummaryItem
        },
        gratuityPercentage: 0,
        gratuityAmount: 0,
        feesPercentage: 10
    }, values);

    this.subtotalPrice = ko.pureComputed(function() {
        return this.pricingItems().reduce(function(total, item) {
            total += item.price();
            return total;
        }, 0);
    }, this);
    
    this.fees = ko.pureComputed(function() {
        var t = this.subtotalPrice(),
            f = this.feesPercentage();
        return t * (f / 100);
    }, this);
    
    this.gratuity = ko.pureComputed(function() {
        var percentage = this.gratuityPercentage() |0,
            amount = this.gratuityAmount() |0;
        return (
            percentage > 0 ?
                (this.subtotalPrice() * (percentage / 100)) :
                amount < 0 ? 0 : amount
        );
    }, this);

    this.totalPrice = ko.pureComputed(function() {
        return this.subtotalPrice() + this.fees() + this.gratuity();
    }, this);
    
    this.feesMessage = ko.pureComputed(function() {
        var f = numeral(this.fees()).format('$#,##0.00');
        return '*includes a __fees__ first-time booking fee'.replace(/__fees__/g, f);
    }, this);

    this.items = ko.pureComputed(function() {

        var items = this.pricingItems().slice();
        var gratuity = this.gratuity();

        if (gratuity > 0) {
            var gratuityLabel = this.gratuityPercentage() ?
                'Gratuity (__gratuity__%)'.replace(/__gratuity__/g, (this.gratuityPercentage() |0)) :
                'Gratuity';

            items.push(new PricingSummaryItem({
                concept: gratuityLabel,
                price: this.gratuity()
            }));
        }

        return items;
    }, this);
}

function setTestingData(vw) {
    vw.summary.pricingItems([
        new PricingSummaryItem({
            concept: 'Deep Tissue Massage',
            price: 99
        }),
        new PricingSummaryItem({
            concept: 'Special oils',
            price: 15
        })
    ]);
}
