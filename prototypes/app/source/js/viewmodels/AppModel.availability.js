/** Availability
**/
'use strict';

var CacheControl = require('../utils/CacheControl'),
    getDateWithoutTime = require('../utils/getDateWithoutTime'),
    moment = require('moment');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = {
        byDate: {/*
            dateYYYY-MM-DD: {
                available: 'high', // 'medium', 'low', 'none'
                slots: ['hour slots'],
                control: new CacheControl()
            }
        */}
    };
    
    api.clearCache = function clearCache() {
        cache.byDate = {};
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    /**
        Get a data object from the Weekly Availability API
        and save it in the cache properly organized by date
    **/
    function saveInCache(data) {
        if (!data || !data.slots) return;
        // Copy slots to cache
        Object.keys(data.slots).forEach(function(sdate) {
            var c;
            if (cache.byDate.hasOwnProperty(sdate)) {
                c = cache.byDate[sdate];
            }
            else {
                c = {
                    control: new CacheControl({
                        ttl: { minutes: 1 }
                    })
                };
                cache.byDate[sdate] = c;
            }

            c.control.touch();
            c.slots = data.slots[sdate] || [];
            c.available = c.slots.length === 0 ?
                'none' :
                c.slots.length < 5 ?
                'low' :
                c.slots.length < 10 ?
                'medium' :
                'high';
        });
    }

    api.byDate = function byDate(date) {
        date = getDateWithoutTime(date);
        var dateKey = moment(date).format('YYYY-MM-DD');

        if (cache.byDate.hasOwnProperty(dateKey) &&
            !cache.byDate[dateKey].control.mustRevalidate()) {
            return Promise.resolve(cache.byDate[dateKey]);
        }
        else {
            // Remote loading data
            return appModel.rest.get('availability/weekly', {
                start: date,
                end: date
            }).then(function(data) {
                saveInCache(data);
                return cache.byDate[dateKey] || { available: 'none', slots: [] };
            });
        }
    };

    return api;
};
