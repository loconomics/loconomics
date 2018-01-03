/**
 * Internal management of user calendar events,
 * local and remote.
 * IMPORTANT: It's mean to be used internally by other data modules
 * (like 'calendar', that features cache and an appropiated API for use
 * in the app)
 */
// TODO store-jsdocs
'use strict';

var CalendarEvent = require('../models/CalendarEvent');
var moment = require('moment');
var ko = require('knockout');
var remote = require('./drivers/restClient');

var getCalendarEvents = function(filters) {
    return remote.get('me/events', filters)
    .then(function(rawItems) {
        return rawItems && rawItems.map(function(rawItem) {
            return new CalendarEvent(rawItem);
        });
    });
};

exports.getEventsByDates = function getEventsByDates(date, end) {

    end = end || moment(date).clone().add(1, 'days').toDate();

    // Remote loading data
    return getCalendarEvents({
        start: date,
        end: end
    }).then(function(events) {

        // Put in array (they are already model instances)
        var arr = ko.observableArray(events);
        // Return the observable array
        // TODO Review really if has sense to have an observable array, take care of its use (on appointments mainly)
        return arr;
    });
};

/**
    Get a specific event by ID
**/
exports.getEvent = function getEvent(id) {
    if (!id) return Promise.reject('The calendarEventID is required to get an event');

    return remote.get('me/events/' + id)
    .then(function(event) {
        return new CalendarEvent(event);
    });
};

exports.appointmentToSimplifiedEvent = function(apt) {

    var rrule = apt.sourceEvent().recurrenceRule();
    if (rrule)
        rrule = apt.sourceEvent().recurrenceRule().model.toPlainObject();

    var occs = apt.sourceEvent().recurrenceOccurrences();
    if (occs)
        occs = occs.map(function(occ) {
            return occ && occ.model.toPlainObject() || null;
        }).filter(function(occ) { return occ !== null; });

    return {
        // The same as apt.sourceEvent().calendarEventID()
        calendarEventID: apt.id() < 0 ? 0 : apt.id(),
        eventTypeID: apt.sourceEvent().eventTypeID(),
        summary: apt.summary(),
        description: apt.description(),
        availabilityTypeID: apt.sourceEvent().availabilityTypeID(),
        location: apt.addressSummary(),
        startTime: apt.startTime(),
        endTime: apt.endTime(),
        isAllDay: apt.sourceEvent().isAllDay(),
        recurrenceRule: rrule,
        recurrenceOccurrences: occs
    };
};

/**
    Creates/updates a booking, given a simplified booking
    object or an Appointment model or a Booking model
**/
exports.setEvent = function setEvent(event) {

    event = event.calendarEventID ?
        event.model.toPlainObject() :
        event.sourceEvent ?
            exports.appointmentToSimplifiedEvent(event) :
            event
    ;

    var id = event.calendarEventID || '';
    var method = id ? 'put' : 'post';

    return remote[method]('me/events' + (id ? '/' : '') + id, event)
    .then(function(serverEvent) {
        return new CalendarEvent(serverEvent);
    });
};
