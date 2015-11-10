/**
**/
'use strict';

var SimplifiedWeeklySchedule = require('../models/SimplifiedWeeklySchedule'),
    RemoteModel = require('../utils/RemoteModel'),
    moment = require('moment');

// A list of week day properties names allowed
// to be part of the objects describing weekly schedule
// (simplified or complete/slot based)
// Just lowecased english names
var weekDayProperties = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new SimplifiedWeeklySchedule(),
        ttl: { minutes: 1 },
        localStorageName: 'weeklySchedule',
        fetch: function fetch() {
            return appModel.rest.get('me/weekly-schedule')
            .then(fromWeeklySchedule);
        },
        push: function push() {
            var plainData = toWeeklySchedule(this.data.model.toPlainObject(true));
            return appModel.rest.put('me/weekly-schedule', plainData)
            .then(fromWeeklySchedule)
            .then(function(result) {
                // We need to recompute availability as side effect of schedule
                appModel.calendar.clearCache();
                // Forward the result
                return result;
            });
        }
    });
    
    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });
    
    return rem;
};

/**
    Basically, from a multi date timeRanges structure
    to a similar with only one timeRange per date and
    managed in minutes in a 'from-to' structure.
    
    Source structure (some weekdays removed for brevity): {
        "timeZone": "America/Los_Angeles",
        "sunday": [{
            "start": "00:00:00",
            "end": "23:59:59"
        }],
        "monday": [],
        "tuesday": null,
        "saturday": [{
            "start": "10:00:00",
            "end": "14:00:00"
        }, {
            "start": "16:30:00",
            "end": "20:30:00"
        }],
        "isAllTime": false
    }
**/
function fromWeeklySchedule(weeklySchedule) {
    
    // New simplified object, as a plain object with
    // weekdays properties and from-to properties like:
    // { sunday: { from: 0, to: 60 } }
    // Since this is expected to be consumed by fetch-push
    // operations, and later by an 'model.updateWith' operation,
    // so plain is simple and better on performance; can be
    // converted easily to the SimplifiedWeeklySchedule object.
    var simpleWS = {
        timeZone: weeklySchedule.timeZone || '',
        isAllTime: weeklySchedule.isAllTime
    };

    // Read timeRanges per week-day
    Object.keys(weeklySchedule)
    .forEach(function(weekday) {
        
        // Verify is a weekday property, or exit early
        if (weekDayProperties.indexOf(weekday) === -1) {
            return;
        }

        var timeRanges = weeklySchedule[weekday];

        if (timeRanges && timeRanges[0]) {
            // Times comes in ISO format "00:00:00" that we convert to minutes
            // (enough precision for simplified weekly schedule)
            // using moment.duration
            simpleWS[weekday] = {
                from: moment.duration(timeRanges[0].start).asMinutes() |0,
                to: moment.duration(timeRanges[0].end).asMinutes() |0
            };
        }
    });

    // Done!
    return simpleWS;
}

/**
    Pass in a plain object, not a model,
    getting an object suitable for the API endpoint.
    
    It returns a structure like the input source expected at fromWeeklySchedule
**/
function toWeeklySchedule(simplifiedWeeklySchedule) {
    
    // Resulting structure
    var weeklySchedule = {
        timeZone: simplifiedWeeklySchedule.timeZone,
        isAllTime: simplifiedWeeklySchedule.isAllTime
    };

    // Avoid extra work if is all time, since all other properties
    // will get discarded on that case.
    // Otherwise, create the weekdays properties with the timeRanges
    if (!weeklySchedule.isAllTime) {
        // Per weekday
        Object.keys(simplifiedWeeklySchedule)
        .forEach(function(weekday) {

            // Verify is a weekday property, or exit early
            if (weekDayProperties.indexOf(weekday) === -1) {
                return;
            }

            var simpleDay = simplifiedWeeklySchedule[weekday];
            
            // If end time is zero, we suppose is no time,
            // so is not added.
            if ((simpleDay.to |0) === 0) {
                return;
            }

            // Convert the minutes to ISO time format (00:00:00)
            // and add it to a new array with a single timeRange:
            weeklySchedule[weekday] = [{
                start: minutesToTimeString(simpleDay.from |0),
                end: minutesToTimeString(simpleDay.to |0)
            }];
        });
    }

    // Done!
    return weeklySchedule;
}

/**
    internal utility function 'to string with two digits almost'
**/
function twoDigits(n) {
    return Math.floor(n / 10) + '' + n % 10;
}

/**
    Convert a number of minutes
    in a string like: 00:00:00 (hours:minutes:seconds)
**/
function minutesToTimeString(minutes) {
    var d = moment.duration(minutes, 'minutes'),
        h = d.hours(),
        m = d.minutes(),
        s = d.seconds();
    
    return (
        twoDigits(h) + ':' +
        twoDigits(m) + ':' +
        twoDigits(s)
    );
}
