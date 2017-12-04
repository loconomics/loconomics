/**
 * Management of the user calendar appointments
 * and access to computed availability,
 * local and remote.
 *
 * Appointments is an abstraction around calendar events
 * that behave as bookings or as 'calendar blocks':
 * - bookings are built on top of an event instance (a booking record
 * must have ever a serviceDateID event).
 * - 'calendar blocks' are just other events created by the user through
 * the API just to set custom times as not available. Internally, are
 * named just 'events', with a data module 'calendarEvents' and its REST API,
 * that even may allow more options than what we define here as a
 * 'calendar block', but we are using them only for that purpose.
 * - other types of events (like imported events, or events that define the
 * weekly schedule) are read-only and not allowed to be modified directly
 * (weekly-schedule events can be modified through the weeklySchedule
 * module and API, imported events only on the origen)
 *
 * With this module, the APIs to manage calendar blocks and bookings
 * are combined as Appointment objects, meant to be easier for the App
 * to manage them.
 *
 * Too, availability information is provided through DateAvailability objects,
 * allowing local computation of availability based on the source data
 * (events of all types, weekly schedule, scheduling preferences),
 * complementing* the data offered by the 'availability' data module.
 */
// TODO *Review if the availabilty data module and related methods and
// computations done here (incluing the DateAvailability class) are
// really complementing themselves or overlaying with potential differences
// in computations that can lead to bugs. If the availability methods offered
// here are 'complemental' (still relevant, used), seems more obvious that
// they must belong to the 'availability' data module even if this one
// is originally meant for just querying availability against the webservice.
// TODO store-jsdocs
'use strict';

var Appointment = require('../models/Appointment');
var DateAvailability = require('../models/DateAvailability');
var DateCache = require('./helpers/DateCache');
var session = require('./session');
var SingleEvent = require('../utils/SingleEvent');
var calendarEvents = require('./calendarEvents');
var bookings = require('./bookings');
var weeklySchedule = require('./weeklySchedule');
var schedulingPreferences = require('./schedulingPreferences');

var cache = new DateCache({
    Model: DateAvailability,
    ttl: { minutes: 10 }
});

/**
 * Event to request to clean cache that depends on calendar data
 * (it means that the calendar cache was cleaned and anything that used
 * it is now invalidated cache)
 */
var cacheCleaningRequestedEvent = new SingleEvent(exports);
exports.cacheCleaningRequested = cacheCleaningRequestedEvent.subscriber;

exports.clearCache = function clearCache() {
    cache.clear();
    cacheCleaningRequestedEvent.emit();
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

/**
    Get a generic calendar appointment object, made of events and/or bookings,
    depending on the given ID in the ids object.

    TODO: gets single apt from the DateCache
**/
exports.getAppointment = function (ids) {

    if (ids.calendarEventID) {
        return calendarEvents.getEvent(ids.calendarEventID)
        .then(Appointment.fromCalendarEvent);
    }
    else if (ids.bookingID) {
        return bookings.getBooking(ids.bookingID)
        .then(function(booking) {
            // An appointment for booking needs the confirmed event information
            return calendarEvents.getEvent(booking.serviceDateID())
            .then(function(event) {
                return Appointment.fromBooking(booking, event);
            });
        });
    }
    else {
        return Promise.reject('Unrecognized ID');
    }
};

exports.setAppointment = function (apt, allowBookUnavailableTime) {

    // TODO: Saving apt must invalidate the cache and force date
    // availability computation with UI update, when start time or start end changes
    // (ever when inserting apt), for the previous date and the new one (if date changed)
    // and only date availability computation if date is the same but time changed.
    // And triggers "this.emit('clearCache');" passing as parameter the dates array that needs refresh

    // If is a booking
    if (apt.sourceBooking()) {
        return bookings.setServiceProfessionalBooking(apt, allowBookUnavailableTime)
        .then(function(booking) {

            // TODO: clearCache, enhance by discarding only the cache for the previous
            // and new date
            exports.clearCache();

            // We need the event information too
            return calendarEvents.getEvent(booking.serviceDateID())
            .then(function(event) {
                return Appointment.fromBooking(booking, event);
            });
        });
    }
    else if (apt.sourceEvent()) {
        return calendarEvents.setEvent(apt)
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
var getRemoteAppointmentsByDate = function (date) {
    return Promise.all([
        bookings.getBookingsByDates(date),
        calendarEvents.getEventsByDates(date)
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
        weeklySchedule.load(),
        schedulingPreferences.load()
    ])
    .then(function(result) {
        var apts = result[0];
        var settings = result[1];
        var prefs = result[2];

        var dateInfo = {
            date: date,
            appointmentsList: apts || [],
            weeklySchedule: settings,
            schedulingPreferences: prefs
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
exports.getDateAvailability = function getDateAvailability(date) {
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
