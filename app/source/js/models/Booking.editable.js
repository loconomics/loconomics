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
        // Connect pricing:
        this.pricingSummary().connectToSelectableServicesView(serviceProfessionalServices);
    };
};

