/** Appointment model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client'),
    Location = require('./Location'),
    Service = require('./Service'),
    moment = require('moment');
   
function Appointment(values) {
    
    Model(this);

    this.model.defProperties({
        // An appointment ever references an event, and its 'id' is a CalendarEventID
        // even if other complementary object are used as 'source'
        id: null,
        
        startTime: null,
        endTime: null,
        
        // Event summary:
        summary: 'New booking',
        description: null,
        
        subtotalPrice: 0,
        feePrice: 0,
        pfeePrice: 0,
        totalPrice: 0,
        ptotalPrice: 0,
        
        preNotesToClient: null,
        postNotesToClient: null,
        preNotesToSelf: null,
        postNotesToSelf: null,
        
        sourceEvent: null,
        sourceBooking: null
        //sourceBookingRequest, maybe future?
    }, values);
    
    values = values || {};

    this.client = ko.observable(values.client ? new Client(values.client) : null);

    this.location = ko.observable(new Location(values.location));
    this.locationSummary = ko.computed(function() {
        return this.location().singleLine();
    }, this);
    
    this.services = ko.observableArray((values.services || []).map(function(service) {
        return (service instanceof Service) ? service : new Service(service);
    }));
    this.servicesSummary = ko.computed(function() {
        return this.services().map(function(service) {
            return service.name();
        }).join(', ');
    }, this);
    
    // Price update on services changes
    // TODO Is not complete for production
    this.services.subscribe(function(services) {
        this.ptotalPrice(services.reduce(function(prev, cur) {
            return prev + cur.price();
        }, 0));
    }.bind(this));
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedStartTime = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedEndTime = ko.pureComputed(function() {
        
        return moment(this.endTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedTimeRange = ko.pureComputed(function() {
        
        return this.displayedStartTime() + '-' + this.displayedEndTime();
        
    }, this);
    
    this.itStarted = ko.pureComputed(function() {
        return (this.startTime() && new Date() >= this.startTime());
    }, this);
    
    this.itEnded = ko.pureComputed(function() {
        return (this.endTime() && new Date() >= this.endTime());
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        return (!this.id());
    }, this);
    
    this.stateHeader = ko.pureComputed(function() {
        
        var text = '';
        if (!this.isNew()) {
            if (this.itStarted()) {
                if (this.itEnded()) {
                    text = 'Completed:';
                }
                else {
                    text = 'Now:';
                }
            }
            else {
                text = 'Upcoming:';
            }
        }

        return text;
        
    }, this);
}

module.exports = Appointment;

/**
    Creates an appointment instance from a CalendarEvent model instance
**/
Appointment.fromCalendarEvent = function fromCalendarEvent(event) {
    var apt = new Appointment();
    
    // Include event in apt
    apt.id(event.calendarEventID());
    apt.startTime(event.startTime());
    apt.endTime(event.endTime());
    apt.summary(event.summary());
    apt.sourceEvent(event);
    
    return apt;
};

/**
    Creates an appointment instance from a Booking and a CalendarEvent model instances
**/
Appointment.fromBooking = function fromBooking(booking, event) {
    // Include event in apt
    var apt = Appointment.fromCalendarEvent(event);
    
    // Include booking in apt
    // TODO Needs review, maybe after redone appointment:
    var prices = booking.bookingRequest() && booking.bookingRequest().pricingEstimate();
    if (prices) {
        apt.subtotalPrice(prices.subtotalPrice());
        apt.feePrice(prices.feePrice());
        apt.pfeePrice(prices.pFeePrice());
        apt.totalPrice(prices.totalPrice());
        apt.ptotalPrice(prices.totalPrice() - prices.pFeePrice());
    }
    apt.sourceBooking(booking);
    
    return apt;
};

/**
    Creates a list of appointment instances from the list of events and bookings.
    The bookings list must contain every booking that belongs to the events of type
    'booking' from the list of events.
**/
Appointment.listFromCalendarEventsBookings = function listFromCalendarEventsBookings(events, bookings) {
    return events.map(function(event) {
        var booking = null;
        bookings.some(function(searchBooking) {
            var found = searchBooking.confirmedDateID() === event.calendarEventID();
            if (found) {
                booking = searchBooking;
                return true;
            }
        });

        if (booking)
            return Appointment.fromBooking(booking, event);
        else
            return Appointment.fromCalendarEvent(event);
    });
};

var Time = require('../utils/Time');
/**
    Creates an Appointment instance that represents a calendar slot of
    free/spare time, for the given time range, or the full given date.
    @param options:Object {
        date:Date. Optional. Used to create a full date slot or default for start/end
            to date start or date end
        start:Date. Optional. Beggining of the slot
        end:Date. Optional. Ending of the slot
        text:string. Optional ['Free']. To allow external localization of the text.
    }
**/
Appointment.newFreeSlot = function newFreeSlot(options) {
    
    var start = options.start || new Time(options.date, 0, 0, 0),
        end = options.end || new Time(options.date, 0, 0, 0);

    return new Appointment({
        id: -2,

        startTime: start,
        endTime: end,

        summary: options.text || 'Free',
        description: null
    });
};
