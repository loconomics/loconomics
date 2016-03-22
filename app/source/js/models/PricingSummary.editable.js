/**
    Extension for the PricingSummary Model: it adds auto-calculations and new useful
    computed observables and functions to a given instance, or just create a new
    one extended if nothing or just a plain object is given.
    The additions are mean to use in a form where the booking is being created or edited,
    with information like the totals calculated when data changes, since that
    fiels are originally just normal observables (used to pull information from database)
    and in the process to create/edit a booking the user needs to see that info calculated,
    based on the booking, pricing and services details.

    IMPORTANT: This is not a Model, but it exports the extended Model with an extra
    static method: it's the function is used to create an instance of the extended model
    (with extra and modified capabilities).
    So, yo do:
    var PricingSummary = require('./models/PricingSummary.editable');
    // Booking is now the ./models/PricingSummary class that contains a PricingSummary.editable(..) function
**/
'use strict';

var PricingSummary = require('./PricingSummary');
module.exports = PricingSummary;

var ko = require('knockout');
var numeral = require('numeral');
var PricingSummaryDetail = require('./PricingSummaryDetail');

PricingSummary.editable = function(obj) {
    // Get base instance
    var pricingSummary;
    if (obj && obj instanceof PricingSummary) {
        pricingSummary = obj;
    }
    else if (obj && obj.model && obj.model.toPlainObject) {
        pricingSummary = new PricingSummary(obj.model.toPlainObject(true));
    }
    else {
        pricingSummary = new PricingSummary(obj);
    }
    
    /// Gratuity support.
    // IMPORTANT: gratuity must have fields at Booking class, but for now server
    // has no support for it, so is a middle work only on UI, so
    // TODO Refactor gratuity to be part of Booking (depending on what fields gets saved)
    pricingSummary.gratuityPercentage = ko.observable(0);
    pricingSummary.gratuityAmount = ko.observable(0);
    pricingSummary.gratuity = ko.pureComputed(function() {
        var percentage = this.gratuityPercentage() |0,
            amount = this.gratuityAmount() |0;
        var r = (
            percentage > 0 ?
                (this.subtotalPrice() * (percentage / 100)) :
                amount < 0 ? 0 : amount
        );
        return r;
    }, pricingSummary);
    
    /// Locally calculating fields
    //pricingSummary.subtotalPrice = ko.pureComputed(function() {
    ko.computed(function() {
        var r = this.details().reduce(function(total, item) {
            total += item.price();
            return total;
        }, 0);
        this.subtotalPrice(r);
    }, pricingSummary);

    //this.clientServiceFeePrice = ko.pureComputed(function() {
    ko.computed(function() {
        var t = +this.subtotalPrice(),
            f = +this.firstTimeServiceFeeFixed(),
            p = +this.firstTimeServiceFeePercentage(),
            min = +this.firstTimeServiceFeeMinimum(),
            max = +this.firstTimeServiceFeeMaximum();
        var a = Math.round((f + ((p / 100) * t)) * 100) / 100;
        var r = Math.min(Math.max(a, min), max);
        this.clientServiceFeePrice(r);
    }, pricingSummary);

    //this.totalPrice = ko.pureComputed(function() {
    ko.computed(function() {
        var r = this.subtotalPrice() + this.clientServiceFeePrice() + this.gratuity();
        this.totalPrice(r);
    }, pricingSummary);

    //this.serviceDurationMinutes = ko.pureComputed(function() {
    ko.computed(function() {
        var r = this.details().reduce(function(total, item) {
            total += item.serviceDurationMinutes();
            return total;
        }, 0);
        this.serviceDurationMinutes(r);
    }, pricingSummary);

    //this.firstSessionDurationMinutes = ko.pureComputed(function() {
    ko.computed(function() {
        var r = this.details().reduce(function(total, item) {
            total += item.firstSessionDurationMinutes();
            return total;
        }, 0);
        this.firstSessionDurationMinutes(r);
    }, pricingSummary);
    

    /// Useful computed observables, mainly for display/UI

    pricingSummary.feesMessage = ko.pureComputed(function() {
        var f = numeral(this.clientServiceFeePrice()).format('$#,##0.00');
        return '*The first-time __fees__ booking fee applies only to the very first time you connect with a professional and helps cover costs of running the marketplace. There are no fees for subsequent bookings with this professional.'.replace(/__fees__/g, f);
    }, pricingSummary);

    pricingSummary.items = ko.pureComputed(function() {

        var items = this.details().slice();
        var gratuity = this.gratuity();

        if (gratuity > 0) {
            var gratuityLabel = this.gratuityPercentage() ?
                'Gratuity (__gratuity__%)'.replace(/__gratuity__/g, (this.gratuityPercentage() |0)) :
                'Gratuity';

            items.push(new PricingSummaryDetail({
                serviceName: gratuityLabel,
                price: gratuity
            }));
        }
        
        var fees = this.clientServiceFeePrice();
        if (fees > 0) {
            var feesLabel = 'First-time booking fee*';
            items.push(new PricingSummaryDetail({
                serviceName: feesLabel,
                price: fees
            }));
        }

        return items;
    }, pricingSummary);
    
    var duration2Language = require('../utils/duration2Language');
    
    pricingSummary.serviceDurationDisplay = ko.pureComputed(function() {
        return duration2Language({ minutes: this.serviceDurationMinutes() });
    }, pricingSummary);
    
    pricingSummary.firstSessionDurationDisplay = ko.pureComputed(function() {
        return duration2Language({ minutes: this.firstSessionDurationMinutes() });
    }, pricingSummary);

    /**
        Allow to connect the booking to an externally created/maintained instance
        of ServiceProfessionalServicesVM, that is able to manage full services details
        and list of user selected ones.
        This connection will update the booking and its pricingSummary wherever the
        list of services and selected ones changes.
    **/
    pricingSummary.connectToSelectableServicesView = function(serviceProfessionalServices) {
        // Automatic update
        serviceProfessionalServices.selectedServices.subscribe(function(services) {
            this.details(services.map(function(service) {
                return PricingSummaryDetail.fromServiceProfessionalService(service);
            }));
        }, this);
    };
};

