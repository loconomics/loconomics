/** UpcomingBookingsSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    BookingSummary = require('./BookingSummary'),
    Booking = require('./Booking');

function UpcomingBookingsSummary(values) {

    Model(this);
    
    this.model.defProperties({
        today: new BookingSummary({
            concept: 'left today',
            timeFormat: ' [ending @] h:mma'
        }),
        tomorrow: new BookingSummary({
            concept: 'tomorrow',
            timeFormat: ' [starting @] h:mma'
        }),
        thisWeek: new BookingSummary({
            concept: 'this week',
            timeFormat: null
        }),
        nextWeek: new BookingSummary({
            concept: 'next week',
            timeFormat: null
        }),
        nextBooking: {
            Model: Booking
        }
    }, values);
    
    this.items = ko.pureComputed(function() {
        var items = [];
        
        if (this.today().quantity())
        items.push(this.today());
        if (this.tomorrow().quantity())
        items.push(this.tomorrow);
        if (this.thisWeek().quantity())
        items.push(this.thisWeek());
        if (this.nextWeek().quantity())
        items.push(this.nextWeek());

        return items;
    }, this);
}

module.exports = UpcomingBookingsSummary;
