/** Events
**/
'use strict';

var CalendarEvent = require('../models/CalendarEvent'),
    moment = require('moment'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
        remote: {
            rest: appModel.rest,
            getCalendarEvents: function(filters) {
                return appModel.rest.get('events', filters)
                .then(function(rawItems) {
                    return rawItems && rawItems.map(function(rawItem) {
                        return new CalendarEvent(rawItem);
                    });
                });
            }
        }
    };
    
    var cache = {
        eventsByDate: {}
    };
    
    api.clearCache = function clearCache() {
        cache.eventsByDate = {};
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    api.getEventsByDate = function getEventsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cache.eventsByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cache.eventsByDate[dateKey].data);

            // TODO lazy load, on background, for synchronization, based on cache control
        }
        else {
            // TODO check localforage copy first?

            // Remote loading data
            return api.remote.getCalendarEvents({
                start: date,
                end: moment(date).add(1, 'days').toDate()
            }).then(function(events) {
                // TODO localforage copy of [dateKey]=bookings

                // Put in cache (they are already model instances)
                var arr = ko.observableArray(events);
                cache.eventsByDate[dateKey] = { data: arr };
                // Return the observable array
                // TODO Review really if has sense to have an observable array, take care of its use (on appointments mainly)
                return arr;
            });
        }
    };
    
    /**
        Get a specific event by ID
        TODO: Implement cache. Reusing cacheByDate, re-index?
    **/
    api.getEvent = function getEvent(id) {
        if (!id) return Promise.reject('The calendarEventID is required to get an event');

        return appModel.rest.get('events/' + id)
        .then(function(event) {
            return new CalendarEvent(event);
        });
    };
    
    api.appointmentToSimplifiedEvent = function(apt) {
        
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
    api.setEvent = function setEvent(event) {

        event = event.calendarEventID ?
            event.model.toPlainObject() :
            event.sourceEvent ?
                api.appointmentToSimplifiedEvent(event) :
                event
        ;

        var id = event.calendarEventID || '',
            method = id ? 'put' : 'post';

        return appModel.rest[method]('events' + (id ? '/' : '') + id, event)
        .then(function(serverEvent) {
            return new CalendarEvent(serverEvent);
        });
    };

    return api;
};
