/**
    A dates range, simplified info usually needed from an CalendarEvent.
**/
'use strict';

var Model = require('./Model');

module.exports = function EventDates(values) {
    
    Model(this);

    this.model.defProperties({
        startTime: null,
        endTime: null
    }, values);
};
