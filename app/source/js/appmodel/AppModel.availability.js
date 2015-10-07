/**
    It uses the server-side availability API.
**/
'use strict';

var CacheControl = require('../utils/CacheControl'),
    CacheControl = require('../utils/CacheControl');

exports.create = function create(appModel) {
    
    var api = {};
    
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
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
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
                control: new CacheControl({ ttl: { minutes: 1 } })
            };
        }
        return c;
    }

    api.times = function times(userID, start, end) {
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
                return saveTimesInCache(queryKey, data);
            });
        }
    };

    return api;
};
