/**
    SimplifiedWeeklySchedule model.
    
    Its 'simplified' because it provides an API
    for simple time range per week day,
    a pair of from-to times.
    Good for current simple UI.
    
    The original weekly schedule defines the schedule
    in 15 minutes slots, so multiple time ranges can
    exists per week day, just marking each slot
    as available or unavailable. The AppModel
    will fill this model instances properly making
    any conversion from/to the source data.
 **/
'use strict';

var ko = require('knockout'),
    moment = require('moment-timezone'),
    Model = require('./Model'),
    WeekDaySchedule = require('./WeekDaySchedule');

/**
    It attemps to locate local/system timezone,
    getting the first IANA tzid that matches 
    local setup.
**/
function detectLocalTimezone() {
    var year = new Date().getFullYear(),
        winter = new Date(year, 1, 1),
        winOff = winter.getTimezoneOffset(),
        summer = new Date(year, 6, 1),
        sumOff = summer.getTimezoneOffset(),
        found = null;

    moment.tz.names().some(function(tz) {
        var zone = moment.tz.zone(tz);
        if (zone.offset(winter) === winOff &&
            zone.offset(summer) === sumOff) {
           found = zone;
           return true;
        }
    });

    return found;
}

/**
    Main model defining the week schedule
    per week date, or just set all days times
    as available with a single flag.
**/
function SimplifiedWeeklySchedule(values) {
    
    Model(this);

    this.model.defProperties({
        sunday: new WeekDaySchedule(),
        monday: new WeekDaySchedule(),
        tuesday: new WeekDaySchedule(),
        wednesday: new WeekDaySchedule(),
        thursday: new WeekDaySchedule(),
        friday: new WeekDaySchedule(),
        saturday: new WeekDaySchedule(),
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
    
    this.timeZoneDisplayName = ko.computed(function() {
        var tzid = this.timeZone(),
            tz = moment.tz(tzid),
            name = tz.tz();
        
        // !moment.tz.zoneExists, just check the name is enough
        if (!name) {
            var localtz = detectLocalTimezone();
            if (localtz)
                tz = moment.tz(localtz.name);
            if (tz)
                name = tz.tz();
            if (name)
                setTimeout(function() {
                    this.timeZone(name);
                }.bind(this), 1);
        }

        if (name)
            return name; // + ' (' + tz.zoneAbbr() + ')';
        else
            return '';
    }, this);
}

module.exports = SimplifiedWeeklySchedule;
