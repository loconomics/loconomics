/**
    It offers access to calendar elements (appointments) and availability
    
    Appointments is an abstraction around calendar events
    that behave as bookings or as events (where bookings are built
    on top of an event instance --a booking record must have ever a confirmedDateID event).
    
    With this appModel, the APIs to manage events&bookings are combined to offer related
    records easier in Appointments objects.
**/
'use strict';

var Appointment = require('../models/Appointment'),
    DateAvailability = require('../models/DateAvailability'),
    CacheControl = require('../utils/CacheControl'),
    moment = require('moment');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = {
        byDate: {/*
            data: DateAvailability(),
            control: CacheControl()
        */}
    };
    
    api.clearCache = function clearCache() {
        cache.byDate = {};
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
        by Date, from the remote source directly.
        Used internally only, to get appointments with and without free/unavailable
        slots use getDateAvailability
    **/
    var getRemoteAppointmentsByDate = function getRemoteAppointmentsByDate(date) {
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

            // Return the array
            return apts;
        });
    };
    
    /**
        Fetch appointments and schedule information for the date from remote
        in a convenient object to use with the DateAvailability model.
    **/
    var getRemoteDateAvailability = function getRemoteDateAvailability(date) {
        return Promise.all([
            getRemoteAppointmentsByDate(date),
            appModel.simplifiedWeeklySchedule.load()
        ])
        .then(function(result) {
            var apts = result[0],
                settings = result[1],
                weekDaySchedule = settings.weekDays[date.getDay()]();

            var dateInfo = {
                date: date,
                appointmentsList: apts || [],
                weekDaySchedule: weekDaySchedule
            };

            return dateInfo;
        });
    };
    
    /**
        Get the appointments and availability for the given date.
        It has cache control, if there is a valid copy is returned
        at the moment, if is reloaded and exists on cache, that copy is
        updated so all previous instances get the updated data too.
    **/
    api.getDateAvailability = function getDateAvailability(date) {
        
        var dateKey = moment(date).format('YYYYMMDD');

        if (cache.byDate.hasOwnProperty(dateKey) &&
            !cache.byDate[dateKey].control.mustRevalidate()) {

            return Promise.resolve(cache.byDate[dateKey].data);
        }
        else {
            return getRemoteDateAvailability(date)
            .then(function(dateInfo) {
                // Update cache
                var c = cache.byDate[dateKey];
                if (c && c.data) {
                    c.data.model.updateWith(dateInfo);
                }
                else {
                    c = {
                        data: new DateAvailability(dateInfo),
                        control: new CacheControl({ ttl: { minutes: 1 } })
                    };
                    cache.byDate[dateKey] = c;
                }
                c.control.touch();
                
                return c.data;
            });
        }
    };

    return api;
};

