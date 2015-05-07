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
                weekDaySchedule = settings.weekDays[date.getDay()](),
                list;

            list = api.fillDayAvailability(apts || [], weekDaySchedule, date);

            return list;
        });
    };
    
    /**
        Introduce free or unavailable slots wherever needed in the given
        array of Appointments, to fill any gap in a natural day
        (from Midnight to Midnight next date) and based on the
        given week day schedule.
        The hours in the schedule are assumed in the local time.
        A new array is returned, but the original gets sorted 
        by startTime.
    **/
    api.fillDayAvailability = function fillDayAvailability(appointmentsList, weekDaySchedule, referenceDate) {

        // First, ensure list is sorted
        var slots = appointmentsList.sort(function(a, b) {
            return a.startTime() > b.startTime();
        });

        var filledSlots = [],
            zeroTime = '00:00:00',
            last = zeroTime,
            lastDateTime = null,
            timeFormat = 'HH:mm:ss';

        if (slots.length === 0) {
            // No slots, empty date so create the required
            // unavailable/free/unavailable slots for the 'referenceDate'
            var fullStart = moment(referenceDate).startOf('day'),
                fullEnd = fullStart.clone().add(1, 'days');
            filledSlots = createScheduleSlots({
                start: fullStart.toDate(),
                end: fullEnd.toDate()
            }, weekDaySchedule);
        }
        else {
            // Look for time gaps in the list
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

                    // There is a gap, fill it
                    filledSlots.push.apply(filledSlots, createScheduleSlots({
                        start: lastDateTime,
                        end: start
                    }, weekDaySchedule));
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

                filledSlots.push.apply(filledSlots, createScheduleSlots({
                    start: lastDateTime,
                    end: nextMidnight
                }, weekDaySchedule));
            }
        }

        return filledSlots;
    };
    
    return api;
};

var createScheduleSlots = function createScheduleSlots(range, weekDaySchedule) {
    /*jshint maxcomplexity:10*/
    var list = [],
        start = range.start,
        end = range.end,
        date = moment(start).startOf('day'),
        from = moment(date).add({ minutes: weekDaySchedule.from() }).toDate(),
        to = moment(date).add({ minutes: weekDaySchedule.to() }).toDate();

    // It happens before the week day schedule starts
    var beforeSchedule = 
        start < from &&
        end <= from;
    // It happens after the week day schedule ends
    var afterSchedule = 
        end > to &&
        start >= to;
    // It happens inside the week day schedule
    var insideSchedule =
        start >= from &&
        end <= to;

    if (beforeSchedule || afterSchedule) {
        list.push(
            Appointment.newUnavailableSlot({
                start: start,
                end: end
            })
        );
    }
    else if (insideSchedule) {
        list.push(
            Appointment.newFreeSlot({
                start: start,
                end: end
            })
        );
    }
    else {
        // Is in a intermediate position, needs two
        // or three slots
        var crossStart =
            start < from &&
            end > from;
        var crossEnd = 
            start < to &&
            end > to;

        if (crossStart) {
            // Unavailable slot until the 'from'
            list.push(
                Appointment.newUnavailableSlot({
                    start: start,
                    end: from
                })
            );
        }
        if (crossEnd) {
            // Unavailable after 'to'
            list.push(
                Appointment.newUnavailableSlot({
                    start: to,
                    end: end
                })
            );
        }

        if (crossStart && crossEnd) {
            // Full day free
            list.push(
                Appointment.newFreeSlot({
                    start: from,
                    end: to
                })
            );
        }
        else if (crossStart) {
            // Free slot until mid point
            list.push(
                Appointment.newFreeSlot({
                    start: from,
                    end: end
                })
            );
        }
        else if (crossEnd) {
            // Free slot from mid point
            list.push(
                Appointment.newFreeSlot({
                    start: start,
                    end: to
                })
            );
        }
    }
    
    // In the complex cases, is easy that the 
    // order gets inversed because of the if-else natural order
    // so ensure goes correct
    return list.sort(function(a, b) {
        return a.startTime() > b.startTime();
    });
};