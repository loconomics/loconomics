/**
    It uses the server-side availability API.
    
    TODO: implement a cache that saves by full local Date rather
    than independent date-ranges; that way, full month queries are filtered
    and splited in per date caches, and further queries for a single date
    are fetched from cache rather than perform a new remote query.
**/
'use strict';

var CacheControl = require('../utils/CacheControl'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter;

exports.create = function create(appModel) {
    
    function Api() {
        EventEmitter.call(this);
        this.setMaxListeners(30);
    }
    Api._inherits(EventEmitter);
    
    var api = new Api();
    
    var cache = {
        times: {/*
            "userID": {
                "startTime-endTime" {
                    // From server:
                    incrementsSizeInMinutes: 15,
                    times: [{startTime:isodatetime, endTime:isodatetime, availability:string],
                    control: new CacheControl()
                }
            }
        */}
    };

    api.clearCache = function clearCache() {
        cache.times = {};
        this.emit('clearCache');
    };
    
    api.clearUserCache = function clearUserCache(userID) {
        delete cache.times[userID];
        this.emit('clearCache', { userID: userID });
    };

    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    var createTimeSlots = require('../utils/createTimeSlots');
    function saveTimesInCache(userID, queryKey, data) {
        var userC = cache.times[userID];
        var c = userC && userC[queryKey];
        if (c) {
            c.times = data.times;
            c.incrementsSizeInMinutes = data.incrementsSizeInMinutes;
            c.control.touch();
        }
        else {
            if (!userC) {
                userC = cache.times[userID] = {};
            }
            c = userC[queryKey] = {
                times: data.times,
                incrementsSizeInMinutes: data.incrementsSizeInMinutes,
                control: new CacheControl({ ttl: { minutes: 1 } }),
                getFreeTimeSlots: function(duration, slotSizeMinutes, includeEndTime) {
                    var size = slotSizeMinutes || this.incrementsSizeInMinutes;
                    return createTimeSlots.forList(this.times, size, duration, true, includeEndTime);
                }
            };
        }
        return c;
    }
    
    function getTimesFromCache(userID, queryKey) {
        var userC = cache.times[userID];
        var c = userC && userC[queryKey];
        if (c && !c.control.mustRevalidate())
            return c;
    }

    api.times = function times(userID, start, end) {
        if (!end) end = moment(start).add(1, 'day').toDate();
        var queryKey = start.toISOString() + '-' + end.toISOString();

        var cached = getTimesFromCache(userID, queryKey);
        if (cached) {
            return Promise.resolve(cached);
        }
        else {
            // Remote loading data
            return appModel.rest.get('users/' + userID + '/availability/times', {
                start: start,
                end: end
            }).then(function(data) {
                // IMPORTANT: REST API is not ensuring resultsets ONLY in the start-end
                // dates, but on all complete availabilityRanges that touches that criteria.
                // SO: Ensure only the wanted set of data is saved
                data.times = createTimeSlots.filterListBy(data.times, start, end);
                // Save and return:
                return saveTimesInCache(userID, queryKey, data);
            });
        }
    };

    return api;
};
