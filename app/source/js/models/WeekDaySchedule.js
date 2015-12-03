/**
    Submodel that is used on the WeeklySchedule
    extending an observable array of 'week day availability TimeRanges'.
**/
'use strict';

var ko = require('knockout');

var TimeRange = require('./TimeRange');

/**
    Extends an observable array of TimeRange (know as a WeekDaySchedule)
    with methods to check and manipulate the day schedule.
**/
function WeekDaySchedule(obsArray) {

    if (!obsArray)
        obsArray = ko.observableArray([]);

    /**
        It allows to know if this week day is 
        enabled for weekly schedule, just it
        has from-to times.
        It allows to be set as true putting
        a default range (9a-5p) or false 
        setting both as 0p.
        
        Since on write two observables are being modified, and
        both are used in the read, a single change to the 
        value will trigger two notifications; to avoid that,
        the observable is rate limited with an inmediate value,
        son only one notification is received.
    **/
    obsArray.isEnabled = ko.computed({
        read: function() {
            var r = obsArray() && obsArray()[0];
            return (r && r.fromMinute() < r.toMinute() || false);
        },
        write: function(val) {
            obsArray.removeAll();
            if (val === true) {
                // Default range 9a - 5p
                obsArray.push(new TimeRange({
                    start: '09:00:00',
                    end: '17:00:00'
                }));
            }
        }
    }).extend({ rateLimit: 0 });

    // 'Is all day' special value is recognized as a unique
    // range for the date, from 00:00:00 (minute 0) to 24:00:00 (minute 1440).
    obsArray.isAllDay = ko.computed({
        read: function() {
            var r = obsArray() && obsArray()[0];
            if (r) {
                return  (
                    r.start() === '00:00:00' &&
                    r.end() === '24:00:00'
                );
            }
            return false;
        },
        write: function(val) {
            if (val === true) {
                obsArray.removeAll();
                obsArray.push(new TimeRange({
                    start: '00:00:00',
                    end: '24:00:00'
                }));
            }
        }
    }).extend({ rateLimit: 0 });
    
    return obsArray;
}

module.exports = WeekDaySchedule;
