/**
    BookingProgress
**/
'use strict';

var Model = require('../models/Model'),
    ko = require('knockout');

function BookingProgress(values) {
    Model(this);

    this.model.defProperties({
        currentStep: '',
        stepsList: []
    }, values);

    this.step = ko.pureComputed({
        read: function() {
            return this.stepsList().indexOf(this.currentStep());
        },
        write: function(index) {
            var name = this.stepsList()[index] || '';
            this.currentStep(name);
        },
        owner: this
    });

    this.totalSteps = ko.pureComputed(function() {
        return this.stepsList().length;
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
        this.currentStep('');
        return this;
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
    return this;
};

BookingProgress.prototype.observeStep = function(stepName) {
    return ko.pureComputed(function() {
        return this.currentStep() === stepName;
    }, this);
};

BookingProgress.prototype.isStep = function(stepName) {
    return this.currentStep() === stepName;
};

BookingProgress.prototype.go = function(stepName) {
    this.currentStep(stepName);
    return this;
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