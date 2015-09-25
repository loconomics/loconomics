/**
    View model for the datetime-picker component/template
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    getDateWithoutTime = require('../utils/getDateWithoutTime'),
    moment = require('moment'),
    Time = require('../utils/Time');

require('../components/DatePicker');
var datepickerAvailability = require('../utils/datepickerAvailability');

function DatetimePickerVM(app, element) {
    
    this.selectedDate = ko.observable(getDateWithoutTime());
    this.isLoading = ko.observable(false);
    this.requiredDuration = ko.observable(0);
    
    this.durationDisplay = ko.pureComputed(function() {
        var fullMinutes = this.requiredDuration();
        if (fullMinutes <= 0)
            return '';

        var hours = Math.floor(fullMinutes / 60),
            minutes = fullMinutes % 60,
            text = '';

        if (hours > 0)
            text += moment.duration({ hours: hours }).humanize() + ' ';
        if (minutes > 0)
            text += moment.duration({ minutes: minutes }).humanize();

        return text;
    }, this);

    this.dateAvail = ko.observable();
    this.groupedSlots = ko.computed(function(){
        
        var requiredDuration = this.requiredDuration();
        
        /*
          before 12:00pm (noon) = morning
          afternoon: 12:00pm until 5:00pm
          evening: 5:00pm - 11:59pm
        */
        // Since slots must be for the same date,
        // to define the groups ranges use the first date
        var datePart = this.dateAvail() && this.dateAvail().date() || new Date();
        var groups = [
            {
                group: 'Morning',
                slots: [],
                starts: new Time(datePart, 0, 0),
                ends: new Time(datePart, 12, 0)
            },
            {
                group: 'Afternoon',
                slots: [],
                starts: new Time(datePart, 12, 0),
                ends: new Time(datePart, 17, 0)
            },
            {
                group: 'Evening',
                slots: [],
                starts: new Time(datePart, 17, 0),
                ends: new Time(datePart, 24, 0)
            }
        ];

        // Populate groups with the time slots
        var slots = this.dateAvail() && this.dateAvail().getFreeTimeSlots(requiredDuration) || [];
        // Iterate to organize by group
        slots.forEach(function(slot) {

            // Filter slots by the increment size preference
            /*var totalMinutes = moment.duration(slot).asMinutes() |0;
            if (totalMinutes % incSize !== 0) {
                return;
            }*/

            // Check every group
            groups.some(function(group) {
                // If matches the group, push to it
                // and go out of groups iteration quickly
                if (slot >= group.starts &&
                    slot < group.ends) {
                    group.slots.push(slot);
                    return true;
                }
            });
        });

        return groups;

    }, this);
    
    this.selectedDatetime = ko.observable(null);
    
    this.selectDatetime = function(selectedDatetime, event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.selectedDatetime(selectedDatetime);
    }.bind(this);

    ///
    /// Time Picker

    this.pickedTime = ko.observable();
    this.allowBookUnavailableTime = ko.observable(false);
    this.unavailableTimeBtnEnabled = ko.observable(false);
    
    this.getPickedDatetime = function() {
        var t = this.pickedTime();
        if (!(t instanceof Date)) {
            // Build date-time
            var timespan = moment.duration(t);
            t = moment(this.selectedDate()).startOf('day').add(timespan).toDate();
        }
        return t;
    };
    
    this.setPickedAsSelected = function() {
        this.allowBookUnavailableTime(true);
        this.selectedDatetime(this.getPickedDatetime());
    }.bind(this);
    
    this.showTimePicker = function() {
        app.modals.showTimePicker({
            title: 'Book an unavailable time',
            selectedTime: null,
            unsetLabel: 'Cancel'
        }).then(function(pickedValue) {
            if (pickedValue.time) {
                this.pickedTime(pickedValue.time);
                this.setPickedAsSelected();
            }
        }.bind(this))
        .catch(function() {
            // Just modal was dismissed, so picker was rejected but not an error
        });
    }.bind(this);
    
    this.reset = function() {
        this.selectedDatetime(null);
        this.pickedTime(null);
        this.allowBookUnavailableTime(false);
    }.bind(this);
    
    this.bindDateData = function bindDateData(date) {

        if (!date) return;
        
        this.isLoading(true);
        return app.model.calendar.getDateAvailability(date)
        .then(function(data) {

            this.dateAvail(data);

            /*var sdate = moment(date).format('YYYY-MM-DD');
            this.slots(data.slots.map(function(slot) {
                // From string to Date
                var dateslot = new Date(sdate + 'T' + slot);
                return dateslot;
            }));*/
        }.bind(this))
        .catch(function(err) {
            this.app.modals.showError({
                title: 'Error loading availability',
                error: err
            });
        }.bind(this))
        .then(function() {
            // Finally
            this.isLoading(false);
        }.bind(this));
    }.bind(this);

    
    ///
    /// Init component and handlers
    // Getting component element
    var $datePicker = $(element).find('.calendar-placeholder');
    $datePicker.show().datepicker({ extraClasses: 'DatePicker--tagged' });
    this.tagAvailability = datepickerAvailability.create(app, $datePicker, this.isLoading);
    
    $datePicker.on('dateChanged', function(e) {
        if (e.viewMode === 'days') {
            this.selectedDate(e.date);
        }
    }.bind(this));

    // Auto bind date data on selected date change:
    this.selectedDate.subscribe(function(date) {
        this.bindDateData(date);
        var elDate = $datePicker.datepicker('getValue');
        if (elDate !== date)
            $datePicker.datepicker('setValue', date, true);
    }.bind(this));
    
    // First data load
    // First load of today data
    this.bindDateData(this.selectedDate())
    .then(function() {
        // Once finished, load the whole month
        this.tagAvailability(this.selectedDate());
    }.bind(this));
    
    // Force first refresh on datepicker to allow
    // event handlers to get notified on first time:
    $datePicker.datepicker('fill');
}

module.exports = DatetimePickerVM;
