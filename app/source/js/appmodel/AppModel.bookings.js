/** Bookings

    IMPORTANT!!!! API not to use directly by the app, but through appModel.calendar (it has cache and more)
**/
'use strict';

var Booking = require('../models/Booking'),
    moment = require('moment'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
        remote: {
            rest: appModel.rest,
            getBookings: function(filters) {
                return appModel.rest.get('me/bookings', filters)
                .then(function(rawItems) {
                    return rawItems && rawItems.map(function(rawItem) {
                        return new Booking(rawItem);
                    });
                });
            }
        }
    };

    api.getBookingsByDates = function getBookingsByDates(date, end) {
        
        end = end || moment(date).clone().add(1, 'days').toDate();
        
        // Remote loading data
        return api.remote.getBookings({
            start: date,
            end: end
        }).then(function(bookings) {
            // Put in cache (they are already model instances)
            var arr = ko.observableArray(bookings);
            // Return the observable array
            return arr;
        });
    };
    
    /**
        Get upcoming bookings meta-information for dashboard page
    **/
    api.getUpcomingBookings = function getUpcomingBookings() {
        return appModel.rest.get('me/upcoming-bookings');
    };

    /**
        Get a specific booking by ID
    **/
    api.getBooking = function getBooking(id) {
        if (!id) return Promise.reject('The bookingID is required to get a booking');
        return appModel.rest.get('me/bookings/' + id)
        .then(function(booking) {
            return new Booking(booking);
        });
    };
    
    /**
        Converts an Appointment model into a simplified
        booking plain object, suitable to REST API for edition
    **/
    api.appointmentToSimplifiedBooking = function(apt) {
        return {
            bookingID: apt.sourceBooking().bookingID(),
            clientUserID: apt.clientUserID(),
            addressID: apt.addressID(),
            startTime: apt.startTime(),
            pricing: apt.pricing().map(function(pricing) {
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
    **/
    api.bookingToSimplifiedBooking = function(booking) {
        return {
            bookingID: booking().bookingID(),
            clientUserID: booking.clientUserID(),
            addressID: booking.addressID(),
            startTime: booking.startTime(),
            pricing: booking.pricingSummary().details().pricing
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
        Creates/updates a booking by a service professional, given a simplified booking
        object or an Appointment model or a Booking model
    **/
    api.setServiceProfessionalBooking = function setServiceProfessionalBooking(booking, allowBookUnavailableTime) {    
        booking = booking.bookingID ?
            api.bookingToSimplifiedBooking(booking) :
            booking.sourceBooking ?
                api.appointmentToSimplifiedBooking(booking) :
                booking
        ;

        var id = booking.bookingID || '',
            method = id ? 'put' : 'post';
        
        booking.allowBookUnavailableTime = allowBookUnavailableTime || false;

        return appModel.rest[method]('me/service-professional-booking/' + id, booking)
        .then(function(serverBooking) {
            return new Booking(serverBooking);
        });
    };
    
    /**
        Creates/updates a booking by a client, given a simplified booking
        object or an Appointment model or a Booking model
    **/
    api.setClientBooking = function setClientBooking(booking) {
        booking = booking.bookingID ?
            api.bookingToSimplifiedBooking(booking) :
            booking.sourceBooking ?
                api.appointmentToSimplifiedBooking(booking) :
                booking
        ;

        var id = booking.bookingID || '',
            method = id ? 'put' : 'post';

        return appModel.rest[method]('me/client-booking/' + id, booking)
        .then(function(serverBooking) {
            return new Booking(serverBooking);
        });
    };

    return api;
};
