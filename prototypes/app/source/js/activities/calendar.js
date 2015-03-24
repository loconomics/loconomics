/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    CalendarSlot = require('../models/CalendarSlot');

require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function CalendarActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Calendar');

    /* Getting elements */
    this.$datepicker = this.$activity.find('#calendarDatePicker');
    this.$dailyView = this.$activity.find('#calendarDailyView');
    this.$dateHeader = this.$activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$chooseNew = $('#calendarChooseNew');
    
    /* Init components */
    this.$datepicker.show().datepicker();
    
    /* Event handlers */
    // Changes on currentDate
    this.registerHandler({
        target: this.viewModel.currentDate,
        handler: function(date) {
            // Trigger a layout update, required by the full-height feature
            $(window).trigger('layoutUpdate');

            if (date) {
                var mdate = moment(date);

                if (mdate.isValid()) {

                    var isoDate = mdate.toISOString();

                    // Update datepicker selected date on date change (from 
                    // a different source than the datepicker itself
                    this.$datepicker.removeClass('is-visible');
                    // Change not from the widget?
                    if (this.$datepicker.datepicker('getValue').toISOString() !== isoDate)
                        this.$datepicker.datepicker('setValue', date, true);

                    // On currentDate changes, update the URL
                    // TODO: save a useful state
                    // DOUBT: push or replace state? (more history entries or the same?)
                    this.app.shell.history.pushState(null, null, 'calendar/' + isoDate);

                    // DONE
                    return;
                }
            }

            // Something fail, bad date or not date at all
            // Set the current 
            this.viewModel.currentDate(new Date());

        }.bind(this)
    });

    // Swipe date on gesture
    this.registerHandler({
        target: this.$dailyView,
        event: 'swipeleft swiperight',
        handler: function(e) {
            e.preventDefault();

            var dir = e.type === 'swipeleft' ? 'next' : 'prev';

            // Hack to solve the freezy-swipe and tap-after bug on JQM:
            $(document).trigger('touchend');
            // Change date
            this.$datepicker.datepicker('moveValue', dir, 'date');

        }.bind(this)
    });

    // Changing date with buttons:
    this.registerHandler({
        target: this.$dateHeader,
        event: 'tap',
        selector: '.CalendarDateHeader-switch',
        handler: function(e) {
            switch (e.currentTarget.getAttribute('href')) {
                case '#prev':
                    this.$datepicker.datepicker('moveValue', 'prev', 'date');
                    break;
                case '#next':
                    this.$datepicker.datepicker('moveValue', 'next', 'date');
                    break;
                default:
                    // Lets default:
                    return;
            }
            e.preventDefault();
            e.stopPropagation();
        }.bind(this)
    });

    // Showing datepicker when pressing the title
    this.registerHandler({
        target: this.$dateTitle,
        event: 'tap',
        handler: function(e) {
            this.$datepicker.toggleClass('is-visible');
            e.preventDefault();
            e.stopPropagation();
        }.bind(this)
    });

    // Updating view date when picked another one
    this.registerHandler({
        target: this.$datepicker,
        event: 'changeDate',
        handler: function(e) {
            if (e.viewMode === 'days') {
                this.viewModel.currentDate(e.date);
            }
        }.bind(this)
    });

    // Set date to match datepicker for first update
    this.viewModel.currentDate(this.$datepicker.datepicker('getValue'));
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    if (options && options.route && options.route.segments) {
        var sdate = options.route.segments[0],
            mdate = moment(sdate),
            date = mdate.isValid() ? mdate.toDate() : null;

        if (date)
            this.viewModel.currentDate(date);
    }
};

var Time = require('../utils/Time');
function createFreeSlot(options) {
    
    var start = options.start || new Time(options.date, 0, 0, 0),
        end = options.end || new Time(options.date, 0, 0, 0);

    return new CalendarSlot({
        startTime: start,
        endTime: end,

        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    });
}

/**
    Take a single CalendarEvent model and single Booking model
    and creates a CalendarSlot, using mainly the event info
    but upgraded with booking info, if there is a booking.
**/
function convertEventToSlot(event, booking) {

    return new CalendarSlot({
        startTime: event.startTime(),
        endTime: event.endTime(),
        
        subject: event.summary(), // FullName
        description: event.description(), // 'Deep Tissue Massage Long Name',
        link: '#!appointment/' + event.calendarEventID(),

        actionIcon: booking === null ? 'glyphicon glyphicon-chevron-right' : null,
        actionText: booking === null ? null : (booking && booking.bookingRequest && booking.bookingRequest.pricingEstimate.totalPrice || '$0.00'),

        classNames: null
    });
}

/**
    Takes appModel observables for events and bookings for the same date
    and creates an array of CalendarSlots.
**/
function slotsFromEventsBookings(events, bookings) {
    return events().map(function(event) {

        var booking = null;
        bookings().some(function(searchBooking) {
            var found = searchBooking.confirmedDateID() === event.calendarEventID();
            if (found) {
                booking = searchBooking;
                return true;
            }
        });

        return convertEventToSlot(event, booking);
    });
}

/**
    Introduce free slots wherever need in the given
    array of CalendarSlots.
    It sorts the array first and append from 12AM to 12AM
    any gap with a free slot.
**/
function fillFreeSlots(slots) {

    // First, ensure list is sorted
    slots = slots.sort(function(a, b) {
        return a.startTime() > b.startTime();
    });
    
    var filledSlots = [],
        zeroTime = '00:00:00',
        last = zeroTime,
        lastDateTime = null,
        timeFormat = 'HH:mm:ss';

    slots.forEach(function(slot) {
        var start = slot.startTime(),
            s = moment(start),
            end = slot.endTime(),
            e = moment(end);

        if (s.format(timeFormat) > last) {
            
            if (lastDateTime === null) {
                // First slot of the date, 12AM=00:00
                lastDateTime = new Date(
                    start.getFullYear(), start.getMonth(), start.getDate(),
                    0, 0, 0
                );
            }

            // There is a gap, filled it
            filledSlots.push(createFreeSlot({
                start: lastDateTime,
                end: start
            }));
        }

        filledSlots.push(slot);
        lastDateTime = end;
        last = e.format(timeFormat);
    });
    
    // Check latest to see a gap at the end:
    var lastEnd = lastDateTime && moment(lastDateTime).format(timeFormat);
    if (lastEnd !== zeroTime) {
        // There is a gap, filled it
        var nextMidnight = new Date(
            lastDateTime.getFullYear(),
            lastDateTime.getMonth(),
            // Next date!
            lastDateTime.getDate() + 1,
            // At zero hours!
            0, 0, 0
        );

        filledSlots.push(createFreeSlot({
            start: lastDateTime,
            end: nextMidnight
        }));
    }

    return filledSlots;
}

function ViewModel(app) {

    this.currentDate = ko.observable(new Date());
    var fullDayFree = [createFreeSlot({ date: this.currentDate() })];

    // slotsSource save the data as processed by a request of 
    // data because a date change.
    // It's updated by changes on currentDate that performs the remote loading
    this.slotsSource = ko.observable(fullDayFree);
    // slots computed, using slotsSource.
    // As computed in order to allow any other observable change
    // from trigger the creation of a new value
    this.slots = ko.computed(function() {
    
        var slots = this.slotsSource();
        
        return fillFreeSlots(slots);

    }, this);
    
    this.isLoading = ko.observable(false);
    
    // Update current slots on date change
    var previousDate = this.currentDate().toISOString();
    this.currentDate.subscribe(function (date) {
        
        // IMPORTANT: The date object may be reused and mutated between calls
        // (mostly because the widget I think), so is better to create
        // a clone and avoid getting race-conditions in the data downloading.
        date = new Date(Date.parse(date.toISOString()));

        // Avoid duplicated notification, un-changed date
        if (date.toISOString() === previousDate) {
            return;
        }
        previousDate = date.toISOString();
        
        var mdate = moment(date),
            sdate = mdate.format('YYYYMMDD');

        this.isLoading(true);
        
        Promise.all([
            app.model.bookings.getBookingsByDate(date),
            app.model.calendarEvents.getEventsByDate(date)
        ]).then(function(group) {
            
            // IMPORTANT: First, we need to check that we 
            // in the same date still, because several loadings
            // can happen at a time (changing quickly from date to date
            // without wait for finish), avoiding a race-condition
            // that create flickering effects or replace the date events
            // by the events from other date, because it tooks more an changed.
            // TODO: still this has the minor bug of losing the isLoading
            // if a previous triggered load still didn't finished; its minor
            // because is very rare that happens, moving this stuff
            // to a special appModel for mixed bookings and events with 
            // per date cache that includes a view object with isLoading will
            // fix it and reduce this complexity.
            if (date.toISOString() !== this.currentDate().toISOString()) {
                // Race condition, not the same!! out:
                return;
            }
            
            var events = group[1],
                bookings = group[0];
            
            if (events && events().length) {
                // Create the slots and update the source:
                this.slotsSource(slotsFromEventsBookings(events, bookings));

                this.isLoading(false);
            }
            else {
                this.slotsSource(fullDayFree);
                this.isLoading(false);
            }

        }.bind(this))
        .catch(function(err) {
            
            // Show free on error
            this.slotsSource(fullDayFree);
            this.isLoading(false);
            
            var msg = 'Error loading calendar events.';
            app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
            
        }.bind(this));

    }.bind(this));
}
