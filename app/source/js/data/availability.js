/**
 * Access to user availability as computed by the server,
 * local and remote.
 */
// TODO Review note at calendar data module about possible collision of APIs
// related to availability (at that module, local computations of availabilty
// is done)
// TODO implement a cache that saves by full local Date rather
//  than independent date-ranges; that way, full month queries are filtered
//  and splited in per date caches, and further queries for a single date
//  are fetched from cache rather than perform a new remote query.
//  The utils/createTimeSlots has a function to do that, it seems.
// TODO store-jsdocs
'use strict';

var CacheControl = require('../utils/CacheControl');
var moment = require('moment');
var session = require('./session');
var remote = require('./drivers/restClient');

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

/**
 * Event to request to clean cache that depends on calendar data
 * (it means that the calendar cache was cleaned and anything that used
 * it is now invalidated cache)
 */
var cacheCleaningRequestedEvent = new SingleEvent(exports);
exports.cacheCleaningRequested = cacheCleaningRequestedEvent.subscriber;

exports.clearCache = function clearCache() {
    cache.times = {};
    cacheCleaningRequestedEvent.emit();
};

exports.clearUserCache = function clearUserCache(userID) {
    delete cache.times[userID];
    cacheCleaningRequestedEvent.emit({ userID: userID });
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
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
                duration = duration || size;
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

exports.times = function times(userID, start, end) {
    if (!end) end = moment(start).add(1, 'day').toDate();
    var queryKey = start.toISOString() + '-' + end.toISOString();

    var cached = getTimesFromCache(userID, queryKey);
    if (cached) {
        return Promise.resolve(cached);
    }
    else {
        // Remote loading data
        return remote.get('users/' + userID + '/availability/times', {
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
