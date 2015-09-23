/**
    Booking activity
    
    It allows a client to book a serviceProfessional
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function BookingActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
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
    
    this.registerHandler({
        target: this.viewModel.progress.step,
        handler: function() {
            // Trigger load of the specific step
            var load = this[this.viewModel.progress.currentStep() + 'Load'];
            if (load)
                load.call(this);
        }.bind(this)
    });

});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    
    this.viewModel.serviceProfessionalID(params[0] |0);
    this.viewModel.jobTitleID(params[1] |0);
    
    // If there is not a serviceProfessional, redirect to search/home page to pick one
    // TODO Same if the serviceProfessional is not found
    if (this.viewModel.serviceProfessionalID() === 0 ||
        this.viewModel.jobTitleID() === 0) {
        this.app.shell.go('/home');
        return;
    }
    
    // Reset progress to none and trigger next so Load logic gets executed
    this.viewModel.progress.step(-1);
    this.viewModel.nextStep();
};

///
/// Registered static list of steps. There are different possible lists depending
/// on provider settings

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

///
/// Methods that initialize/load each step, given the name of registered steps
/// and sufix 'Load'

A.prototype.servicesLoad = function() {
    // TODO Depends on jobTitle:
    this.viewModel.supportGratuity(true);    
};

A.prototype.selectLocationLoad = function() {
    // TODO Load remote addresses for provider and jobtitle
    this.viewModel.serviceAddresses.sourceAddresses([]);
    // TEST
    this.app.model.serviceAddresses.getList(this.viewModel.jobTitleID())
    .then(function(list) {
        list = this.app.model.serviceAddresses.asModel(list);
        this.viewModel.serviceAddresses.sourceAddresses(list);
    }.bind(this));
};

A.prototype.selectTimesLoad = function() {
    // TODO 
};

A.prototype.selectTimeLoad = function() {
    // TODO 
};

A.prototype.paymentLoad = function() {
    // TODO 
};

A.prototype.confirmLoad = function() {
    // TODO 
};

var ServiceProfessionalServiceVM = require('../viewmodels/ServiceProfessionalService'),
    BookingProgress = require('../viewmodels/BookingProgress'),
    ServiceAddresses = require('../viewmodels/ServiceAddresses');

function ViewModel(app) {
    //jshint maxstatements:40
    
    this.serviceAddresses = new ServiceAddresses();
    
    this.serviceProfessionalID = ko.observable(0);
    this.jobTitleID = ko.observable(0);
    this.instantBooking = ko.observable(true);
    this.isLocked = ko.observable(false);
    this.bookingHeader = ko.pureComputed(function() {
        return this.instantBooking() ? 'Your instant booking' : 'Your booking request';
    }, this);
    
    this.photoUrl = ko.pureComputed(function() {
        return app.model.config.siteUrl + '/en-US/Profile/Photo/' + this.serviceProfessionalID();
    }, this);
    
    // Se inicializa con un estado previo al primer paso
    // (necesario para el manejo de reset y preparación del activity)
    this.progress = new BookingProgress({ step: -1 });
    
    ko.computed(function() {
        this.progress.stepsList(this.instantBooking() ? instantBookingSteps : bookingRequestSteps);
    }, this);
    
    this.serviceProfessionalServices = new ServiceProfessionalServiceVM(app);
    this.jobTitleID.subscribe(this.serviceProfessionalServices.jobTitleID);
    this.serviceProfessionalID.subscribe(this.serviceProfessionalServices.serviceProfessionalID);
    this.serviceProfessionalServices.isSelectionMode(true);
    //this.serviceProfessionalServices.preSelectedServices([]);
    
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
    // Automatic summary updates:
    this.gratuityPercentage.subscribe(this.summary.gratuityPercentage);
    this.gratuityAmount.subscribe(this.summary.gratuityAmount);
    ko.computed(function() {
        var services = this.serviceProfessionalServices.selectedServices();
        // TODO Support special pricing types (housekeeper, hourly pricing).
        this.summary.pricingItems(services.map(function(service) {
            return new PricingSummaryItem({
                concept: service.name(),
                price: service.price()
            });
        }));
    }, this);
    
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
