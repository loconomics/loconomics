/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');

require('../components/DatePicker');
var datepickerAvailability = require('../utils/datepickerAvailability');

var Activity = require('../components/Activity');

var A = Activity.extends(function CalendarActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Calendar');

    /* Getting elements */
    this.$datepicker = this.$activity.find('#calendarDatePicker');
    this.$dailyView = this.$activity.find('#calendarDailyView');
    this.$dateTitle = this.$activity.find('.CalendarDateHeader > .btn');
    this.$chooseNew = $('#calendarChooseNew');
    
    /* Init components */
    this.$datepicker.show().datepicker({ extraClasses: 'DatePicker--tagged' });
    
    this.tagAvailability = datepickerAvailability.create(this.app, this.$datepicker, this.viewModel.isLoading);

    /* Event handlers */
    // Changes on currentDate
    this.registerHandler({
        target: this.viewModel.currentDate,
        handler: function(date) {

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
            this.viewModel.currentDate(getDateWithoutTime());

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

    // Showing datepicker when pressing the title
    this.registerHandler({
        target: this.$dateTitle,
        event: 'click',
        handler: function(e) {
            this.$datepicker.toggleClass('is-visible');
            e.preventDefault();
            e.stopPropagation();
        }.bind(this)
    });

    // Updating view date when picked another one
    this.registerHandler({
        target: this.$datepicker,
        event: 'dateChanged',
        handler: function(e) {
            if (e.viewMode === 'days') {
                this.viewModel.currentDate(getDateWithoutTime(e.date));
            }
        }.bind(this)
    });

    // Set date to today
    this.viewModel.currentDate(getDateWithoutTime());
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Date from the parameter, fallback to today
    var sdate = options.route && options.route.segments && options.route.segments[0],
        date;
    if (sdate) {
        // Parsing date from ISO format
        var mdate = moment(sdate);
        // Check is valid, and ensure is date at 12AM
        date = mdate.isValid() ? getDateWithoutTime(mdate.toDate()) : null;
    }
    
    if (!date)
        // Today:
        date = getDateWithoutTime();
    
    // Reset to force new data load (can happens if schedule was change or anything in the middle)
    this.viewModel.previousDate = null;
    this.viewModel.currentDate(date);
    // Force a refresh of tags
    this.tagAvailability(date, true);
};

var Appointment = require('../models/Appointment'),
    TimeSlotViewModel = require('../viewmodels/TimeSlot');

function ViewModel(app) {

    this.currentDate = ko.observable(getDateWithoutTime());
    var fullDayFree = [Appointment.newFreeSlot({ date: this.currentDate() })];
    // The 'free' event must update with any change in currentDate
    this.currentDate.subscribe(function(date) {
        if (date) {
            fullDayFree[0].startTime(date);
            fullDayFree[0].endTime(date);
        }
    }, this);

    // slotsSource save the data as processed by a request of 
    // data because a date change.
    // It's updated by changes on currentDate that performs the remote loading
    this.slotsSource = ko.observable(fullDayFree);
    // slots computed, using slotsSource.
    // As computed in order to allow any other observable change
    // from trigger the creation of a new value
    this.slots = ko.computed(function() {
    
        var slots = this.slotsSource();
        
        // Hide unavailable slots, except if there is only one slot (so there
        // is ever something displayed)
        if (slots.length > 1) {
            slots = slots.filter(function(slot) {
                return slot.id() !== Appointment.specialIds.unavailable;
            });
        }
        
        return slots.map(TimeSlotViewModel.fromAppointment);

    }, this);
    
    this.isLoading = ko.observable(false);

    // Update current slots on date change
    // previousDate is public to allow being reset on a new show (discard old data
    // by forcing a load)
    this.previousDate = this.currentDate().toISOString();
    this.currentDate.subscribe(function (date) {

        // IMPORTANT: The date object may be reused and mutated between calls
        // (mostly because the widget I think), so is better to create
        // a clone and avoid getting race-conditions in the data downloading.
        date = new Date(Date.parse(date.toISOString()));

        // Avoid duplicated notification, un-changed date
        if (date.toISOString() === this.previousDate) {
            return;
        }
        this.previousDate = date.toISOString();

        this.isLoading(true);
        
        app.model.calendar.getDateAvailability(date)
        .then(function(dateAvail) {
            
            // IMPORTANT: First, we need to check that we are
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
        
            // Update the source:
            this.slotsSource(dateAvail.list());
            this.isLoading(false);

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
