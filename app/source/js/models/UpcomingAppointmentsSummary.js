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
            timeFormat: ' [Next is] MMMM Qo [@] h:mma'
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
    
    this.currentAppointment = ko.pureComputed(function() {
        var b = this.nextBooking();
        if (b) {
            var today = (new Date()).toISOString().substr(0, 10);
            var bookday = b.serviceDate() && b.serviceDate().startTime() || '';
            bookday = (typeof(bookday) === 'string' ? bookday : bookday.toISOString()).substr(0, 10);
            if (bookday === today) {
                return b;
            }
        }
        return null;
    }, this);
}

module.exports = UpcomingAppointmentsSummary;
