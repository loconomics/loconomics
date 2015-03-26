/**
    Appointments is an abstraction around calendar events
    that behave as bookings or as events (where bookings are built
    on top of an event instance --a booking record must have ever a confirmedDateID event).
    
    With this appModel, the APIs to manage events&bookings are combined to offer related
    records easier in Appointments objects.
**/
'use strict';

var Appointment = require('../models/Appointment'),
    moment = require('moment');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = {
        aptsByDate: {}
    };

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
    
    /**
        Introduce free slots wherever needed in the given
        array of Appointments, to fill any gap in a natural day
        (from Midnight to Midnight next date).
        A new array is returned, but the original gets sorted 
        by startTime.
    **/
    api.fillWithFreeSlots = function fillWithFreeSlots(appointmentsList) {

        // First, ensure list is sorted
        var slots = appointmentsList.sort(function(a, b) {
            return a.startTime() > b.startTime();
        });

        var filledSlots = [],
            zeroTime = '00:00:00',
            last = zeroTime,
            lastDateTime = null,
            timeFormat = 'HH:mm:ss';

        slots.forEach(function(slot) {
            var start = slot.startTime(),
                s = moment(start),
                end = slot.endTime(),
                e = moment(end);

            if (s.format(timeFormat) > last) {

                if (lastDateTime === null) {
                    // First slot of the date, 12AM=00:00
                    lastDateTime = new Date(
                        start.getFullYear(), start.getMonth(), start.getDate(),
                        0, 0, 0
                    );
                }

                // There is a gap, filled it
                filledSlots.push(Appointment.newFreeSlot({
                    start: lastDateTime,
                    end: start
                }));
            }

            filledSlots.push(slot);
            lastDateTime = end;
            last = e.format(timeFormat);
        });

        // Check latest to see a gap at the end:
        var lastEnd = lastDateTime && moment(lastDateTime).format(timeFormat);
        if (lastEnd !== zeroTime) {
            // There is a gap, filled it
            var nextMidnight = new Date(
                lastDateTime.getFullYear(),
                lastDateTime.getMonth(),
                // Next date!
                lastDateTime.getDate() + 1,
                // At zero hours!
                0, 0, 0
            );

            filledSlots.push(Appointment.newFreeSlot({
                start: lastDateTime,
                end: nextMidnight
            }));
        }

        return filledSlots;
    };
    
    return api;
};
