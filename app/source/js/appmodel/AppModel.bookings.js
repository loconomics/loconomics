/** Bookings

    IMPORTANT!! Some APIs here are intented for use through appModel.calendar (it has cache and more)
    and not directly by the app.
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
        Get upcoming appointments meta-information for dashboard page
    **/
    api.getUpcomingAppointments = function getUpcomingAppointments() {
        return appModel.rest.get('me/upcoming-appointments');
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
            jobTitleID: apt.jobTitleID(),
            clientUserID: apt.clientUserID(),
            serviceAddress: apt.address().model.toPlainObject(),
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
    api.bookingToSimplifiedBooking = function(booking) {
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
            // IMPORTANT: If the booking included a new address, we need to invalidate the cache
            // for the addresses APIs, to force a load for the newest addresses on that APIs
            if (!booking.serviceAddress.addressID) {
                // If client address
                if (booking.serviceAddress.userID == booking.clientUserID) {
                    appModel.clientAddresses.clearCache();
                    appModel.clientAddresses.removeGroupFromLocalCache(booking.clientUserID);
                }
                else { // professional service address
                    appModel.serviceAddresses.clearCache();
                    appModel.serviceAddresses.removeGroupFromLocalCache(booking.jobTitleID);
                }
            }
            return new Booking(serverBooking);
        });
    };
    
    api.declineBookingByServiceProfessional = function declineBookingByServiceProfessional(bookingID) {
        return appModel.rest.post('me/service-professional-booking/' + bookingID + '/deny')
        .then(function(serverBooking) {
            // Reset calendar availability cache
            appModel.calendar.clearCache();
            return new Booking(serverBooking);
        });
    };
    
    api.cancelBookingByServiceProfessional = function cancelBookingByServiceProfessional(bookingID) {
        return appModel.rest.post('me/service-professional-booking/' + bookingID + '/cancel')
        .then(function(serverBooking) {
            // Reset calendar availability cache
            appModel.calendar.clearCache();
            return new Booking(serverBooking);
        });
    };
    
    api.cancelBookingByClient = function cancelBookingByClient(bookingID) {
        return appModel.rest.post('me/client-booking/' + bookingID + '/cancel')
        .then(function(serverBooking) {
            return new Booking(serverBooking);
        });
    };
    
    api.declineBookingByClient = function declineBookingByClient(bookingID) {
        return appModel.rest.post('me/client-booking/' + bookingID + '/deny')
        .then(function(serverBooking) {
            return new Booking(serverBooking);
        });
    };
    
    // dateType values allowed by REST API: 'preferred', 'alternative1', 'alternative2'
    api.confirmBookingRequest = function confirmBookingRequest(bookingID, dateType) {
        return appModel.rest.post('me/service-professional-booking/' + bookingID + '/confirm', { dateType: dateType })
        .then(function(serverBooking) {
            // Reset calendar availability cache
            appModel.calendar.clearCache();
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
    api.requestClientBooking = function requestClientBooking(booking, requestOptions, billingAddress, paymentMethod) {
        var data = createClientBookingRequest(booking, requestOptions, billingAddress, paymentMethod);
        return appModel.rest.post('me/client-booking', data);
    };
    
    /**
        Ask for initialization data of a new client booking
        
        @param options {
            serviceProfessionalUserID:int,
            jobTitleID:int,
            bookCode:string [Optional]
        }
    **/
    api.getNewClientBooking = function getNewClientBooking(options) {
        return appModel.rest.get('me/client-booking', options);
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
    api.setClientBooking = function setClientBooking(booking) {
        return appModel.rest.put('me/client-booking/' + booking.bookingID(), createClientBookingUpdateObject(booking));
    };

    return api;
};
