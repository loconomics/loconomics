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
        stepsList: []
    }, values);

    this.totalSteps = ko.pureComputed(function() {
        return this.stepsList().length;
    }, this);
    
    this.currentStep = ko.pureComputed(function() {
        return this.stepsList()[this.step()];
    }, this);
    
    /// Check when the progress has reached the end almost once
    var maxStepReachedEver = ko.observable(-1);
    ko.computed(function() {
        var s = this.step();
        if (s > maxStepReachedEver()) maxStepReachedEver(s);
    }, this);
    this.ended = ko.pureComputed(function() {
        var lastStep = this.totalSteps() - 1;
        return lastStep <= maxStepReachedEver();
    }, this);
    this.reset = function() {
        maxStepReachedEver(-1);
        this.step(-1);
    };
}

module.exports = BookingProgress;

BookingProgress.prototype.next = function() {
    if (this.ended()) {
        // Go last directly
        this.step(this.totalSteps() - 1);
    }
    else {
        var step = Math.max(0, Math.min(this.step() + 1, this.totalSteps() - 1));
        this.step(step);
    }
};

BookingProgress.prototype.observeStep = function(stepName) {
    return ko.pureComputed(function() {
        return this.isStep(stepName);
    }, this);
};

BookingProgress.prototype.isStep = function(stepName) {
    return this.stepsList()[this.step()] === stepName;
};

BookingProgress.prototype.go = function(stepName) {
    var step = this.stepsList().indexOf(stepName);
    this.step(step > -1 ? step : 0);
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