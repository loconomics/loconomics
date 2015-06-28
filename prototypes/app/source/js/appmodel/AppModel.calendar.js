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
    DateCache = require('../utils/DateCache'),
    moment = require('moment'),
    _ = require('lodash');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = new DateCache({
        Model: DateAvailability,
        ttl: { minutes: 1 }
    });
    
    api.clearCache = function clearCache() {
        cache.clear();
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
        
        // TODO: Saving apt must invalidate the cache and force date
        // availability computation with UI update, when start time or start end changes 
        // (ever when inserting apt), for the previous date and the new one (if date changed)
        // and only date availability computation if date is the same but time changed.
        // IT WORKS now, because on activities/appointment, in a id/startTime handler, the 
        // whole calendar cache is removed on change/set, but is lot of cache invalidation.
        
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
            appModel.bookings.getBookingsByDates(date),
            appModel.calendarEvents.getEventsByDates(date)
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
        
        var cached = cache.getSingle(date);

        if (cached) {
            return Promise.resolve(cached);
        }
        else {
            return getRemoteDateAvailability(date)
            .then(function(dateInfo) {
                // Update cache and retun data as class instance
                return cache.set(date, dateInfo).data;
            });
        }
    };
    
    
    //////
    // NEW MULTI DATES API
    
    /**
        Get a list of generic calendar appointment objects, made of events and/or bookings
        by Date, from the remote source directly.
        Used internally only, to get appointments with and without free/unavailable
        slots use getDateAvailability
    **/
    var getRemoteAppointmentsByDates = function getRemoteAppointmentsByDates(start, end) {
        return Promise.all([
            appModel.bookings.getBookingsByDates(start, end),
            appModel.calendarEvents.getEventsByDates(start, end)
        ]).then(function(group) {

            var events = group[1],
                bookings = group[0],
                apts = [];

            if (events && events().length) {
                apts = Appointment.listFromCalendarEventsBookings(events(), bookings());
            }

            // Group apts by date
            var grouped = _.groupBy(apts, function(apt) {
                return moment(apt.startTime()).format('YYYY-MM-DD');
            });
            
            // Ensure all the dates in the range are filled, with empty arrays in the holes.
            // NOTE: this way of first group apts and then fill gaps makes the resulting object
            // to display properties out of order (if some hole needed being filled out).
            var date = new Date(start);
            while (date <= end) {
                var key = moment(date).format('YYYY-MM-DD');
                
                if (!grouped.hasOwnProperty(key))
                    grouped[key] = [];

                // Next date:
                date.setDate(date.getDate() + 1);
            }

            return grouped;
        });
    };
    
    /**
        Fetch appointments and schedule information for the dates from remote
        in a convenient object to use with the DateAvailability model
        (returns an array of them).
    **/
    var getRemoteDatesAvailability = function getRemoteDatesAvailability(start, end) {
        return Promise.all([
            getRemoteAppointmentsByDates(start, end),
            appModel.simplifiedWeeklySchedule.load()
        ])
        .then(function(result) {
            var aptsDates = result[0],
                settings = result[1],
                results = {};

            Object.keys(aptsDates).forEach(function(dateKey) {
                var date = moment(dateKey, 'YYYY-MM-DD').toDate();
                var weekDaySchedule = settings.weekDays[date.getDay()]();
            
                var dateInfo = {
                    date: date,
                    appointmentsList: aptsDates[dateKey] || [],
                    weekDaySchedule: weekDaySchedule
                };

                results[dateKey] = dateInfo;
            });

            return results;
        });
    };
    
    api.getDatesAvailability = function getDatesAvailability(start, end) {

        var cacheResults = cache.get(start, end);
        // We know what dates we need and what data is cached already
        // If all cached, just resolve to cache
        if (cacheResults.minHole === null) {
            return Promise.resolve(cacheResults.byDate);
        }
        
        // Request all dates in the range (even if some cached in between)
        return getRemoteDatesAvailability(cacheResults.minHole, cacheResults.maxHole)
        .then(function(results) {
            // Add results to cache, creating DateAvailability object
            // and add that to the resultset
            Object.keys(results).forEach(function(dateKey) {
                cacheResults.byDate[dateKey] = cache.set(dateKey, results[dateKey]).data;
            });
            return cacheResults.byDate;
        });
    };

    return api;
};

