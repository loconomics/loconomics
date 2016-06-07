/** Cancellation Policy model
 **/
'use strict';

var Model = require('../models/Model');
var ko = require('knockout');
var moment = require('moment');

var observableTime = ko.observable(new Date());
setInterval(function() {
    observableTime(new Date());
}, 1 * 60 * 1000);

function CancellationPolicy(values) {
    
    Model(this);
    
    this.model.defProperties({
        cancellationPolicyID: 0,
        name: '',
        description: '',
        hoursRequired: 0,
        cancellationFeeBefore: 0,
        cancellationFeeAfter: 0
    }, values);
    
    this.cancellationFeeBeforeDisplay = ko.pureComputed(function() {
        if (this.cancellationFeeBefore()>0){
            return 'be charged a ' + Math.floor(this.cancellationFeeBefore() * 100) + '% cancellation fee';
        }
        else {
            return 'not be charged any cancellation fee';
        }
    }, this);
    
    this.cancellationFeeAfterDisplay = ko.pureComputed(function() {
        return Math.floor(this.cancellationFeeAfter() * 100) + '%';
    }, this);

    this.refundLimitDate = ko.computed(function() {
        var d = moment(observableTime()).clone();
        d
        .add(7, 'days')
        .subtract(this.hoursRequired(), 'hours');
        return d.toDate();
    }, this);
}

module.exports = CancellationPolicy;
