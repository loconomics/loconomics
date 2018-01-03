/**
    WeeklySchedule model.
 **/
'use strict';

var ko = require('knockout');
var moment = require('moment-timezone');
var Model = require('./Model');
var WeekDaySchedule = require('./WeekDaySchedule');
var TimeRange = require('./TimeRange');

var timeZoneList = require('../utils/timeZoneList');

/**
    Main model defining the week schedule
    per week date, or just set all days times
    as available with a single flag.
**/
function WeeklySchedule(values) {

    Model(this);

    this.model.defProperties({
        sunday: {
            isArray: true,
            Model: TimeRange
        },
        monday: {
            isArray: true,
            Model: TimeRange
        },
        tuesday: {
            isArray: true,
            Model: TimeRange
        },
        wednesday: {
            isArray: true,
            Model: TimeRange
        },
        thursday: {
            isArray: true,
            Model: TimeRange
        },
        friday: {
            isArray: true,
            Model: TimeRange
        },
        saturday: {
            isArray: true,
            Model: TimeRange
        },
        isAllTime: false,
        timeZone: ''
    }, values);

    // Index access
    this.weekDays = [
        this.sunday,
        this.monday,
        this.tuesday,
        this.wednesday,
        this.thursday,
        this.friday,
        this.saturday
    ];

    this.weekDays.forEach(WeekDaySchedule);

    this.displayedTimeZoneFormatter = function(tzid) {
        var zone = moment.tz.zone(tzid);
        var m = moment().startOf('year');
        if (tzid) {
            return tzid + ' (' + zone.abbr(m.valueOf()) + ')';
        }
        else {
            return '';
        }
    };

    this.timeZoneDisplayName = ko.computed(function () {
        var tzid = this.timeZone();
        return tzid ? timeZoneList.timeZoneToDisplayFormat(this.timeZone()) : '';
    }, this);
}

module.exports = WeeklySchedule;
