/**
    A dates range, simplified info usually needed from an CalendarEvent.
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    moment = require('moment');

module.exports = function EventDates(values) {
    
    Model(this);

    this.model.defProperties({
        startTime: null,
        endTime: null
    }, values);
    
    this.duration = ko.computed({
        read: function() {
            var s = this.startTime(),
                e = this.endTime();
            if (!s || !e) return null;
            
            return moment.duration(e - s);
        },
        write: function(value) {
            var s = this.startTime();

            if (!(value || value === 0) || !s) {
                this.endTime(null);
                return;
            }

            var newEnd = moment(s).clone().add(value);
            this.endTime(newEnd.toDate());
        },
        owner: this
    });
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedStartTime = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedEndTime = ko.pureComputed(function() {
        
        return moment(this.endTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedTimeRange = ko.pureComputed(function() {
        
        return this.displayedStartTime() + '-' + this.displayedEndTime();
        
    }, this);
};
