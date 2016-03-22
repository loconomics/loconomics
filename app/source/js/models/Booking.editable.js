/**
    Extension for the Booking Model: it adds auto-calculations and new useful
    computed observables and functions to a given Booking instance, or just create a new
    one extended if nothing or just a plain object is given.
    The additions are mean to use in a form where the booking is being created or edited,
    with information like the summary totals calculated when data changes, since that
    fiels are originally just normal observables (used to pull information from database)
    and in the process to create/edit a booking the user needs to see that info calculated,
    based on the booking, pricing and services details.

    IMPORTANT: This is not a Model, but it exports the extended Model with an extra
    static method: it's the function is used to create an instance of the extended model
    (with extra and modified capabilities).
    So, yo do:
    var Booking = require('./models/Booking.editable');
    // Booking is now the ./models/Booking class that contains a Booking.editable(..) function
**/
'use strict';

var Booking = require('./Booking');
module.exports = Booking;

var ko = require('knockout');
var PricingSummary = require('./PricingSummary.editable');

Booking.editable = function(obj) {
    // Get base instance
    var booking;
    if (obj && obj instanceof Booking) {
        booking = obj;
    }
    else if (obj && obj.model && obj.model.toPlainObject) {
        booking = new Booking(obj.model.toPlainObject(true));
    }
    else {
        booking = new Booking(obj);
    }
    
    /// Auto calculate pricing summary
    PricingSummary.editable(booking.pricingSummary());
    
    /**
        Allow to connect the booking to an externally created/maintained instance
        of ServiceProfessionalServicesVM, that is able to manage full services details
        and list of user selected ones.
        This connection will update the booking and its pricingSummary wherever the
        list of services and selected ones changes.
    **/
    booking.connectToSelectableServicesView = function(serviceProfessionalServices) {
        // Sync: Automatic updates between dependent models:
        this.jobTitleID.subscribe(serviceProfessionalServices.jobTitleID);
        this.serviceProfessionalUserID.subscribe(serviceProfessionalServices.serviceProfessionalID);
        
        this.pricingSummary().connectToSelectableServicesView(serviceProfessionalServices);
    };
    
    /**
        Allow to enable server lookup for postalCode, that allows to validate it and return the city and stateProvince
        info for the code automatically while user edits the booking serviceAddress
        @param app:object Reference to the app instance, needed to access the appModel of postal codes
        @param enabledObservable:bool An observable or computed that behave as a switch that allows external control
        about if the lookup must be performed or not. It's required, so if the lookup wants to be permanentely enabled
        just pass in a ko.observable(true).
        @param errorMessageObservable:string An observable that the lookup process will update with the
        error message of validating the postal code, or set to null if was successfully.
        
        NOTE: Based on code from addressEditor.js, but this a bit more generic.
    **/
    booking.connectPostalCodeLookup = function(app, enabledObservable, errorMessageObservable) {
        // On change to a valid code, do remote look-up
        ko.computed(function() {
            var address = this.serviceAddress();

            if (!enabledObservable()) return;

            var postalCode = address.postalCode();

            if (postalCode && !/^\s*$/.test(postalCode)) {
                app.model.postalCodes.getItem(postalCode)
                .then(function(info) {
                    if (info) {
                        address.city(info.city);
                        address.stateProvinceCode(info.stateProvinceCode);
                        address.stateProvinceName(info.stateProvinceName);
                        errorMessageObservable('');
                    }
                })
                .catch(function(err) {
                    address.city('');
                    address.stateProvinceCode('');
                    address.stateProvinceName('');
                    // Expected errors, a single message, set
                    // on the observable
                    var msg = typeof(err) === 'string' ? err : null;
                    if (msg || err && err.responseJSON && err.responseJSON.errorMessage) {
                        errorMessageObservable(msg || err.responseJSON.errorMessage);
                    }
                    else {
                        // Log to console for debugging purposes, on regular use an error on the
                        // postal code is not critical and can be transparent; if there are 
                        // connectivity or authentification errors will throw on saving the address
                        console.error('Server error validating Zip Code', err);
                    }
                });
            }
        }, this)
        // Avoid excessive requests by setting a timeout since the latest change
        .extend({ rateLimit: { timeout: 60, method: 'notifyWhenChangesStop' } });
    };
};

