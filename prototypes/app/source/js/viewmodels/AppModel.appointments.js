/**
    Appointments is an abstraction around calendar events
    that behave as bookings or as events (where bookings are built
    on top of an event instance --a booking record must have ever a confirmedDateID event).
    
    With this appModel, the APIs to manage events&bookings are combined to offer related
    records easier in Appointments objects.
**/
'use strict';

var Appointment = require('../models/Appointment'),
    DateAvailability = require('../models/DateAvailability'),
    moment = require('moment');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = {
        aptsByDate: {}
    };
    
    api.clearCache = function clearCache() {
        cache.aptsByDate = {};
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    /**
        Get a generic calendar appointment object, made of events and/or bookings,
        depending on the given ID in the ids object.
        
        TODO: Implement cache for the Appointment Models (the back-end models for
        bookings and events is already managed by its own API).
    **/
    api.getAppointment = function getAppointment(ids) {

        if (ids.calendarEventID) {
            return appModel.calendarEvents.getEvent(ids.calendarEventID)
            .then(Appointment.fromCalendarEvent);
        }
        else if (ids.bookingID) {
            return appModel.bookings.getBooking(ids.bookingID)
            .then(function(booking) {
                // An appointment for booking needs the confirmed event information
                return appModel.calendarEvents.getEvent(booking.confirmedDateID())
                .then(function(event) {
                    return Appointment.fromBooking(booking, event);
                });
            });
        }
        else {
            return Promise.reject('Unrecognized ID');
        }
    };
    
    api.setAppointment = function setAppointment(apt) {
        
        // If is a booking
        if (apt.sourceBooking()) {
            return appModel.bookings.setBooking(apt)
            .then(function(booking) {
                // We need the event information too
                return appModel.calendarEvents.getEvent(booking.confirmedDateID())
                .then(function(event) {
                    return Appointment.fromBooking(booking, event);
                });
            });
        }
        else if (apt.sourceEvent()) {
            return appModel.calendarEvents.setEvent(apt)
            .then(function(event) {
                return Appointment.fromCalendarEvent(event);
            });
        }
        else {
            return Promise.reject(new Error('Unrecognized appointment object'));
        }
    };
    
    /**
        Get a list of generic calendar appointment objects, made of events and/or bookings
        by Date.
        It's cached.
    **/
    api.getAppointmentsByDate = function getAppointmentsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cache.aptsByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cache.aptsByDate[dateKey].data);

            // TODO lazy load, on background, for synchronization, depending on cache control
        }
        else {
            // TODO check localforage copy first?

            // Remote loading data
            return Promise.all([
                appModel.bookings.getBookingsByDate(date),
                appModel.calendarEvents.getEventsByDate(date)
            ]).then(function(group) {

                var events = group[1],
                    bookings = group[0],
                    apts = [];

                if (events && events().length) {
                    apts = Appointment.listFromCalendarEventsBookings(events(), bookings());
                }
                
                // TODO localforage copy of [dateKey]=bookings
                
                // Put in cache
                cache.aptsByDate[dateKey] = { data: apts };
                // Return the array
                return apts;
            });
        }
    };
    
    api.getDateAvailability = function getDateAvailability(date) {
        return Promise.all([
            api.getAppointmentsByDate(date),
            appModel.simplifiedWeeklySchedule.load()
        ])
        .then(function(result) {
            var apts = result[0],
                settings = result[1],
                weekDaySchedule = settings.weekDays[date.getDay()]();

            var dateAvail = new DateAvailability({
                date: date,
                sourceList: apts || [],
                weekDaySchedule: weekDaySchedule
            });

            return dateAvail;
        });
    };
    
    return api;
};

