/**
    It uses the server-side availability API.
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
            "userID-startTime-endTime": {
                // From server:
                incrementsSizeInMinutes: 15,
                times: [{startTime:isodatetime, endTime:isodatetime, availability:string],
                control: new CacheControl()
            }
        */}
    };
    
    api.clearCache = function clearCache() {
        cache.times = {};
        this.emit('clearCache');
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    var createTimeSlots = require('../utils/createTimeSlots');
    function saveTimesInCache(queryKey, data) {
        var c = cache.times[queryKey];
        if (c) {
            c.times = data.times;
            c.incrementsSizeInMinutes = data.incrementsSizeInMinutes;
            c.control.touch();
        }
        else {
            c = cache.times[queryKey] = {
                times: data.times,
                incrementsSizeInMinutes: data.incrementsSizeInMinutes,
                control: new CacheControl({ ttl: { minutes: 1 } }),
                getFreeTimeSlots: function(duration, slotSizeMinutes) {
                    var size = slotSizeMinutes || this.incrementsSizeInMinutes;
                    return createTimeSlots.forList(this.times, size, duration, true);
                }
            };
        }
        return c;
    }

    api.times = function times(userID, start, end) {
        if (!end) end = moment(start).add(1, 'day').toDate();
        var queryKey = userID + '-' + start.toISOString() + '-' + end.toISOString();

        if (cache.times.hasOwnProperty(queryKey) &&
            !cache.times[queryKey].control.mustRevalidate()) {
            return Promise.resolve(cache.times[queryKey]);
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
                return saveTimesInCache(queryKey, data);
            });
        }
    };

    return api;
};
