/**
 * Internal management of user bookings,
 * local and remote.
 * IMPORTANT: It's mean to be used internally by other data modules
 * (like 'calendar', that features cache and an appropiated API for use
 * in the app)
 */
// TODO store-jsdocs
'use strict';

import SingleEvent from '../utils/SingleEvent';

var Booking = require('../models/Booking');
var moment = require('moment');
var ko = require('knockout');
var remote = require('./drivers/restClient');
var clientAddresses = require('./clientAddresses');
var serviceAddresses = require('./serviceAddresses');

var getBookings = function(filters) {
    return remote.get('me/bookings', filters)
    .then(function(rawItems) {
        return rawItems && rawItems.map(function(rawItem) {
            return new Booking(rawItem);
        });
    });
};

exports.getBookingsByDates = function getBookingsByDates(date, end) {

    end = end || moment(date).clone().add(1, 'days').toDate();

    // Remote loading data
    return getBookings({
        start: date,
        end: end
    }).then(function(bookings) {
        var arr = ko.observableArray(bookings);
        // Return the observable array
        return arr;
    });
};

/**
    Get upcoming bookings meta-information for dashboard page
**/
exports.getUpcomingBookings = function getUpcomingBookings() {
    return remote.get('me/upcoming-bookings');
};

/**
    Get upcoming appointments meta-information for dashboard page
**/
exports.getUpcomingAppointments = function getUpcomingAppointments() {
    return remote.get('me/upcoming-appointments');
};

/**
    Get a specific booking by ID
**/
exports.getBooking = function getBooking(id) {
    if (!id) return Promise.reject('The bookingID is required to get a booking');
    return remote.get('me/bookings/' + id)
    .then(function(booking) {
        return new Booking(booking);
    });
};

/**
    Converts an Appointment model into a simplified
    booking plain object, suitable to REST API for edition
**/
exports.appointmentToSimplifiedBooking = function(apt) {
    return {
        bookingID: apt.sourceBooking() && apt.sourceBooking().bookingID(),
        jobTitleID: apt.jobTitleID(),
        clientUserID: apt.clientUserID(),
        serviceAddress: apt.address() ? apt.address().model.toPlainObject() : null,
        startTime: apt.startTime(),
        services: apt.pricing().map(function(pricing) {
            // TODO: for now, the REST API allow only a list of IDs,
            // not objects, so next line is replaced:
            //return pricing.model.toPlainObject(true);
            return pricing.serviceProfessionalServiceID();
        }),
        preNotesToClient: apt.preNotesToClient(),
        preNotesToSelf: apt.preNotesToSelf(),
        postNotesToClient: apt.postNotesToClient(),
        postNotesToSelf: apt.postNotesToSelf()
    };
};
/**
    Converst a Booking model into a simplified
    booking plain object, suitable to REST API for edition

    ONLY FOR SERVICE-PROFESSIONAL-BOOKINGS
**/
exports.bookingToSimplifiedBooking = function(booking) {
    //console.log('DEBUG to simplified booking', booking.pricingSummary());
    return {
        bookingID: booking().bookingID(),
        clientUserID: booking.clientUserID(),
        serviceAddress: booking.serviceAddress().model.toPlainObject(),
        startTime: booking.startTime(),
        services: booking.pricingSummary() && booking.pricingSummary().details().pricing
        .map(function(pricing) {
            // TODO: for now, the REST API allow only a list of IDs,
            // not objects, so next line is replaced:
            //return pricing.model.toPlainObject(true);
            return pricing.serviceProfessionalServiceID();
        }),
        preNotesToClient: booking.preNotesToClient(),
        preNotesToSelf: booking.preNotesToSelf(),
        postNotesToClient: booking.postNotesToClient(),
        postNotesToSelf: booking.postNotesToSelf()
    };
};

/**
 * @private {SingleEvent}
 */
const onDataChanges = new SingleEvent();
/**
 * Notifies when a change was pushed successfully to the server (like a new booking
 * or an update)
 * @member {SingleEvent}
 */
exports.onDataChanges = onDataChanges.subscriber;

/**
    Creates/updates a booking by a service professional, given a simplified booking
    object or an Appointment model or a Booking model
**/
exports.setServiceProfessionalBooking = function setServiceProfessionalBooking(booking, allowBookUnavailableTime) {
    booking = booking.bookingID ?
        exports.bookingToSimplifiedBooking(booking) :
        booking.sourceBooking ?
            exports.appointmentToSimplifiedBooking(booking) :
            booking
    ;

    var id = booking.bookingID || '';
    var method = id ? 'put' : 'post';

    booking.allowBookUnavailableTime = allowBookUnavailableTime || false;

    return remote[method]('me/service-professional-booking/' + id, booking)
    .then(function(serverBooking) {
        // IMPORTANT: If the booking included a new address, we need to invalidate the cache
        // for the addresses APIs, to force a load for the newest addresses on that APIs
        if (!booking.serviceAddress.addressID) {
            // If client address
            if (booking.serviceAddress.userID == booking.clientUserID) {
                clientAddresses.clearCache();
                clientAddresses.removeGroupFromLocalCache(booking.clientUserID);
            }
            else { // professional service address
                serviceAddresses.clearCache();
                serviceAddresses.removeGroupFromLocalCache(booking.jobTitleID);
            }
        }
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

exports.declineBookingByServiceProfessional = function declineBookingByServiceProfessional(bookingID) {
    return remote.post('me/service-professional-booking/' + bookingID + '/deny')
    .then(function(serverBooking) {
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

exports.cancelBookingByServiceProfessional = function cancelBookingByServiceProfessional(bookingID) {
    return remote.post('me/service-professional-booking/' + bookingID + '/cancel')
    .then(function(serverBooking) {
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

exports.cancelBookingByClient = function cancelBookingByClient(bookingID) {
    return remote.post('me/client-booking/' + bookingID + '/cancel')
    .then(function(serverBooking) {
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

exports.declineBookingByClient = function declineBookingByClient(bookingID) {
    return remote.post('me/client-booking/' + bookingID + '/deny')
    .then(function(serverBooking) {
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

// dateType values allowed by REST API: 'preferred', 'alternative1', 'alternative2'
exports.confirmBookingRequest = function confirmBookingRequest(bookingID, dateType) {
    return remote.post('me/service-professional-booking/' + bookingID + '/confirm', { dateType: dateType })
    .then(function(serverBooking) {
        onDataChanges.emit();
        return new Booking(serverBooking);
    });
};

/**
    Using data to create a booking from a create client booking form,
    as: booking, billingAddress, paymentMethod, requestOptions (promotionalCode, bookCode, etc.)
    returns an object with the request fields to pass in to the REST API asking
    create the client booking.

    NOTE: Do NOT confuse with previous internal concept 'booking request'. Is called a
    request because the fields and data passed in when creating a booking are different
    from a existent booking.
**/
var createClientBookingRequest = function(booking, requestOptions, paymentMethod) {

    var billingAddress = paymentMethod && paymentMethod.billingAddress();
    paymentMethod = paymentMethod && paymentMethod.model.toPlainObject();
    if (billingAddress) {
        billingAddress = billingAddress.model.toPlainObject();
        delete paymentMethod.billingAddress;
    }

    return {
        serviceProfessionalUserID: booking.serviceProfessionalUserID(),
        jobTitleID: booking.jobTitleID(),
        serviceStartTime: booking.serviceDate() && booking.serviceDate().startTime(),
        alternative1StartTime: booking.alternativeDate1() && booking.alternativeDate1().startTime(),
        alternative2StartTime: booking.alternativeDate2() && booking.alternativeDate2().startTime(),

        serviceAddress: booking.serviceAddress() && booking.serviceAddress().model.toPlainObject(),

        services: booking.pricingSummary() && booking.pricingSummary().details()
        .map(function(pricing) {
            return pricing.serviceProfessionalServiceID();
        }),

        bookCode: ko.unwrap(requestOptions.bookCode),
        promotionalCode: ko.unwrap(requestOptions.promotionalCode),

        // Only a group of fields from a standard address object are read by the server:
        billingAddress: billingAddress && {
            addressLine1: billingAddress.addressLine1,
            addressLine2: billingAddress.addressLine2,
            postalCode: billingAddress.postalCode
        },

        paymentMethod: paymentMethod,

        specialRequests: booking.specialRequests()
    };
};

/**
    Creates a client booking
    @param booking model/Booking
    @param requestOptions { promotionalCode, bookCode }
**/
exports.requestClientBooking = function requestClientBooking(booking, requestOptions, billingAddress, paymentMethod) {
    var data = createClientBookingRequest(booking, requestOptions, billingAddress, paymentMethod);
    return remote.post('me/client-booking', data).then((result) => {
        onDataChanges.emit();
        return result;
    });
};

/**
    Ask for initialization data of a new client booking

    @param options {
        serviceProfessionalUserID:int,
        jobTitleID:int,
        bookCode:string [Optional]
    }
**/
exports.getNewClientBooking = function getNewClientBooking(options) {
    return remote.get('me/client-booking', options);
};

/**
    A client booking update allows a subset of the booking plain-data and some
    fields needs conversion (services, asn in createClientBookingRequest).
    It receives a booking instance filled in with form data and returns a plain object.
**/
var createClientBookingUpdateObject = function(booking) {
    return {
        serviceStartTime: booking.serviceDate() && booking.serviceDate().startTime(),
        serviceAddress: booking.serviceAddress() && booking.serviceAddress().model.toPlainObject(),

        services: booking.pricingSummary() && booking.pricingSummary().details()
        .map(function(pricing) {
            return pricing.serviceProfessionalServiceID();
        }),

        specialRequests: booking.specialRequests()
    };
};
exports.setClientBooking = function setClientBooking(booking) {
    return remote.put('me/client-booking/' + booking.bookingID(), createClientBookingUpdateObject(booking)).then((result) => {
        onDataChanges.emit();
        return result;
    });
};
