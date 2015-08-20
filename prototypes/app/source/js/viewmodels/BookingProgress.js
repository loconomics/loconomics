/**
    BookingProgress
**/
'use strict';

var Model = require('../models/Model'),
    ko = require('knockout');

function BookingProgress(values) {
    Model(this);

    this.model.defProperties({
        step: 0,
        stepsList: [],
        ended: false
    }, values);
    
    this.totalSteps = ko.pureComputed(function() {
        return this.stepsList().length;
    }, this);
}

module.exports = BookingProgress;

BookingProgress.prototype.next = function() {
    var step = Math.max(0, Math.min(this.step() + 1, this.totalSteps() - 1));
    
    this.step(step);
};

BookingProgress.prototype.observeStep = function(stepName) {
    return ko.pureComputed(function() {
        return this.isStep(stepName);
    }, this);
};

BookingProgress.prototype.isStep = function(stepName) {
    return this.stepsList()[this.step()] === stepName;
};

/*
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
*/