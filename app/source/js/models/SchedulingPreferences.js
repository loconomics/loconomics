/**
    SchedulingPreferences model.
 **/
'use strict';

var Model = require('./Model');

function SchedulingPreferences(values) {
    
    Model(this);

    this.model.defProperties({
        advanceTime: 24, // Hours
        betweenTime: 0, // Hours
        incrementsSizeInMinutes: 15
    }, values);
}

module.exports = SchedulingPreferences;
