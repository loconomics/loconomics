/**
    Keeps a date availability object that includes a list of appointments
    that fills all the times in the date (following the weekDaySchedule and free/unavailable
    times) and summary of the availability status of the date.
    Updating the main properties: appointmentsList, date, weekDaySchedule, the complete
    list and summaries auto calculate to show the proper listing.
**/
'use strict';

var Model = require('../models/Model');
var Appointment = require('../models/Appointment'),
    WeekDaySchedule = require('../models/WeekDaySchedule'),
    moment = require('moment'),
    ko = require('knockout'),
    availabilityCalculation = require('../utils/availabilityCalculation'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');

function DateAvailability(values) {

    Model(this);
    
    this.model.defProperties({
        date: null, // Date
        weekDaySchedule: {
            Model: WeekDaySchedule
        },
        appointmentsList: {
            isArray: true,
            Model: Appointment
        }
    }, values);
    
    /**
        :array<Appointment> List of appointments for all the times in the date.
        It introduces free and unavailable appointments using appointmentsList as base
        for actual *busy* appointments and the rules of weekDaySchedule
    **/
    this.list = ko.pureComputed(function() {
        return availabilityCalculation.fillDayAvailability(
            this.date(), this.appointmentsList(), this.weekDaySchedule()
        );
    }, this);

    /**
        :int
        Number of minutes scheduled for work in a generic/empty day
        based on the information at weekDaySchedule.
    **/
    this.workDayMinutes = ko.pureComputed(function() {
        var schedule = this.weekDaySchedule();
        // from-to are minutes of the day, so its easy to calculate
        return (schedule.to() - schedule.from()) |0;
    }, this);

    /**
        :int
        Number of minutes available to be scheduled in this date
        inside the work time (weekDaySchedule.
        It's the sum of all 'Free' appointments in the date.
    **/
    this.availableMinutes = ko.pureComputed(function() {
        return this.list().reduce(function(minutes, apt) {
            if (apt.id() === Appointment.specialIds.free) {
                var et = moment(apt.endTime()),
                    st = moment(apt.startTime());
                minutes += et.diff(st, 'minutes');
            }
            return minutes;
        }, 0);
    }, this);

    /**
        :int
        Percentage number from 0 to 100 of time
        available time in the date (availableMinutes / workDayMinutes)
    **/
    this.availablePercent = ko.pureComputed(function() {
        return (Math.round((this.availableMinutes() / this.workDayMinutes()) * 100));
    }, this);

    /**
        :string
        A text value from an enumeration that represents
            ranges of availablePercent, suitable for high level use as CSS classes.
            Special case on past date-time, when it returns 'past' rather than the
            availability, since past times are not availabile for anything new (can't change the past! ;-)
            Can be: 'none', 'low', 'medium', 'full', 'past'
    **/
    this.availableTag = ko.pureComputed(function() {
        var perc = this.availablePercent(),
            date = this.date(),
            today = getDateWithoutTime();

        if (date < today)
            return 'past';
        else if (perc >= 100)
            return 'full';
        else if (perc >= 50)
            return 'medium';
        else if (perc > 0)
            return 'low';
        else // <= 0
            return 'none';
    }, this);
    
    /**
        Retrieve a list of date-times that are free, available to be used,
        in this date with a separation between each of the given slotSize
        in minutes.
        
        TODO: Implement a second parameter 'duration' so the returned slots
                are free almost for the given duration. This fix the current problem
                of show slots that don't fit the needed service duration (because ends in an
                unavailable slot).
    **/
    this.getFreeTimeSlots = function getFreeTimeSlots(slotSizeMinutes, duration) {
        
        if (!duration)
            duration = slotSizeMinutes;
        
        var date = this.date(),
            today = getDateWithoutTime();
    
        // Quick return if with empty list when
        // - past date (no time)
        // - no available time (already computed)
        if (date < today ||
            this.availableMinutes() <= 0) {
            return [];
        }
        else {
            var slots = [];
            // Iterate every free appointment
            this.list().forEach(function (apt) {
                if (apt.id() === Appointment.specialIds.free) {
                    slots.push.apply(slots, createTimeSlots(apt.startTime(), apt.endTime(), slotSizeMinutes, duration));
                }
            });
            return slots;
        }
    };
}

module.exports = DateAvailability;

/**
    It creates slots between the given times and size for each one.
    Past times are avoided, because are not available
**/
function createTimeSlots(from, to, size, duration) {
    var i = moment(from),
        d,
        slots = [],
        now = new Date(),
        enought;

    // Shortcut if bad 'to' (avoid infinite loop)
    if (to <= from)
        return slots;

    while(i.toDate() < to) {
        d = i.clone().toDate();
        enought = i.clone().add(duration, 'minutes').toDate();
        // Check that:
        // - is not a past date
        // - it has enought time in advance to fill the expected duration
        if (d >= now &&
            enought <= to)
            slots.push(d);
        // Next slot
        i.add(size, 'minutes');
    }
    
    return slots;
}
