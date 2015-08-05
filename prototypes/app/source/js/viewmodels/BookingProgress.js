/**
    BookingProgress
**/
'use strict';

var Model = require('../models/Model');

function BookingProgress(values) {
    Model(this);

    this.model.defProperties({
        step: 0,
        totalSteps: 0,
        ended: false
    }, values);
}

BookingProgress.prototype.getRequestData = function() {
    
    var data = {
        progress: {}
    };
    
    if (!this.ended()) {

        var step = data.step() || 1,
            total = data.totalSteps() || 1;
        // TODO I18N
        data.title = step + ' of ' + total;
        data.navTitle = null;
    } else {
        // Edition title:
        data.title = null;
        data.navTitle = 'Booking';
    }

    return data;
};
