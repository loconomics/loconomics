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
    availabilityCalculation = require('../utils/availabilityCalculation');

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
            Can be: 'none', 'low', 'medium', 'full'
    **/
    this.availableTag = ko.pureComputed(function() {
        var perc = this.availablePercent();
        if (perc >= 100)
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
    **/
    this.getFreeTimeSlots = function getFreeTimeSlots(slotSizeMinutes) {
        if (this.availableMinutes() <= 0) {
            // No time, quick return with empty list
            return [];
        }
        else {
            var slots = [];
            // Iterate every free appointment
            this.list().forEach(function (apt) {
                if (apt.id() === Appointment.specialIds.free) {
                    slots.push.apply(slots, createTimeSlots(apt.startTime(), apt.endTime(), slotSizeMinutes));
                }
            });
            return slots;
        }
    };
}

module.exports = DateAvailability;

function createTimeSlots(from, to, size) {
    var i = moment(from),
        slots = [];

    // Shortcut if bad 'to' (avoid infinite loop)
    if (to <= from)
        return slots;

    while(i.toDate() < to) {
        slots.push(i.clone().toDate());
        i.add(size, 'minutes');
    }
    
    return slots;
}
