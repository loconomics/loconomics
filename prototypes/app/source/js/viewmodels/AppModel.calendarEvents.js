/** Events
**/
'use strict';

var CalendarEvent = require('../models/CalendarEvent'),
//  apiHelper = require('../utils/apiHelper'),
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

    /*apiHelper.defineCrudApiForRest({
        extendedObject: api.remote,
        Model: CalendarEvent,
        modelName: 'CalendarEvent',
        modelListName: 'CalendarEvents',
        modelUrl: 'events',
        idPropertyName: 'calendarEventID'
    });*/

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
    
    api.eventToSimplifiedEvent = function(/*event*/) {
        throw new Error('Not Implemented');
    };
    api.appointmentToSimplifiedEvent = function(/*event*/) {
        throw new Error('Not Implemented');
    };
    
    /**
        Creates/updates a booking, given a simplified booking
        object or an Appointment model or a Booking model
    **/
    api.setEvent = function setEvent(event) {

        event = event.calendarEventID ?
            api.eventToSimplifiedEvent(event) :
            event.sourceEvent ?
                api.appointmentToSimplifiedEvent(event) :
                event
        ;

        var id = event.calendarEventID || '',
            method = id ? 'put' : 'post';

        return appModel.rest[method]('events/' + id)
        .then(function(serverEvent) {
            return new CalendarEvent(serverEvent);
        });
    };

    return api;
};
