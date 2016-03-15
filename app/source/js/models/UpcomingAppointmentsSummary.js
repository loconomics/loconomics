/** UpcomingAppointmentsSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    BookingSummary = require('./BookingSummary'),
    Booking = require('./Booking');

function UpcomingAppointmentsSummary(values) {

    Model(this);
    
    this.model.defProperties({
        pendingRequests: new BookingSummary({
            concept: 'pending appointment requests',
            timeFormat: null
        }),
        nextOnes: new BookingSummary({
            concept: 'more appointments coming up',
            timeFormat: null
        }),
        pendingScheduling: new BookingSummary({
            concept: 'to be scheduled',
            timeFormat: null
        }),
        nextBooking: {
            Model: Booking
        }
    }, values);
    
    this.items = ko.pureComputed(function() {
        var items = [];
        
        if (this.pendingRequests().quantity())
        items.push(this.pendingRequests());
        if (this.nextOnes().quantity())
        items.push(this.nextOnes());
        if (this.pendingScheduling().quantity())
        items.push(this.pendingScheduling());

        return items;
    }, this);
}

module.exports = UpcomingAppointmentsSummary;
