/**
    TimeRange model
**/
'use strict';

var Model = require('./Model'),
    moment = require('moment'),
    ko = require('knockout');

function TimeRange(values) {
    Model(this);
    
    this.model.defProperties({
        start: '00:00:00',
        end: '00:00:00'
    }, values);
    
    // Additional interfaces to get/set the range times
    // by using a different data unit or format.

    this.fromMinute = ko.computed({
        read: function() {
            return timeStringToMinutes(this.start());
        },
        write: function(minutes) {
            this.start(minutesToTimeString(minutes |0));
        },
        owner: this
    });
    this.toMinute = ko.computed({
        read: function() {
            return timeStringToMinutes(this.end());
        },
        write: function(minutes) {
            this.end(minutesToTimeString(minutes |0));
        },
        owner: this
    });
}

module.exports = TimeRange;

//// UTILS,
// TODO Organize or externalize.
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

function timeStringToMinutes(time) {
    return moment.duration(time).asMinutes() |0;
}
