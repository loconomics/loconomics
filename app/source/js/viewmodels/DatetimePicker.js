/**
    View model for the datetime-picker component/template
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');
var moment = require('moment-timezone');

require('../components/DatePicker');
var datepickerAvailability = require('../utils/datepickerAvailability');

var timeZoneList = require('../utils/timeZoneList');
var availability = require('../data/availability');

function DatetimePickerVM(app, element) {
    //jshint maxstatements: 40

    this.selectedDate = ko.observable(getDateWithoutTime());
    this.userID = ko.observable();
    this.isLoading = ko.observable(false);
    this.requiredDurationMinutes = ko.observable(0);
    this.includeEndTime = ko.observable(false);
    this.timeZone = ko.observable('');
    // Let's external code to add a set of objects { id: tzID, label: tzLabel }
    // to display at top, below the 'auto' option.
    this.specialTimeZones = ko.observableArray([]);

    this.durationDisplay = ko.pureComputed(function() {
        var fullMinutes = this.requiredDurationMinutes();
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

    /**
     * Converts the given date to the given timeZone but
     * discarding time info, so gets a midnight time for the
     * same numerical date (times are not meant to be equivalent).
     * Returns a moment object able to manage timezone.
     * Example: 2016-12-13 00:00 UTC -> 2016-12-13 00:00 PST,
     * same date part with time as zero (even if different at source date).
     * No equivalent instant, since for that UTC, the PST is
     * actually 2016-12-12 16:00.
     * If no timeZone, returns as local date at the start of the date.
     */
    this.getDateAtTimeZone = function(date, timeZone) {
        var s;
        if (timeZone) {
            // Get only the date part of the local-date picked
            // (format as 2016-01-01)
            // and generate a moment with that and the timezone, so we
            // get the start of the date at the correct time zone
            // NOTE: if we just build a moment(date) and pass
            // the timezone with .tz(tz) we are getting the wrong
            // date at lot of cases
            s = moment.tz(moment(date).format('Y-MM-DD'), timeZone);
        }
        else {
            s = moment(date).startOf('day');
        }
        return s;
    };

    this.dateAvail = ko.observable();
    this.groupedSlots = ko.computed(function(){

        var requiredDurationMinutes = this.requiredDurationMinutes();
        var includeEndTime = this.includeEndTime();
        var tz = this.timeZone() || timeZoneList.getLocalTimeZone();

        /*
          before 12:00pm (noon) = morning
          afternoon: 12:00pm until 5:00pm
          evening: 5:00pm - 11:59pm
        */
        // Since slots must be for the same date,
        // to define the groups ranges use the first date
        var baseDate = this.getDateAtTimeZone(this.selectedDate() || new Date(), tz);
        var groups = [
            {
                group: 'Morning',
                slots: [],
                starts: baseDate.clone().hour(0).minute(0).second(0),
                ends: baseDate.clone().hour(12).minute(0).second(0)
            },
            {
                group: 'Afternoon',
                slots: [],
                starts: baseDate.clone().hour(12).minute(0).second(0),
                ends: baseDate.clone().hour(17).minute(0).second(0)
            },
            {
                group: 'Evening',
                slots: [],
                starts: baseDate.clone().hour(17).minute(0).second(0),
                ends: baseDate.clone().hour(24).minute(0).second(0)
            }
        ];

        // Populate groups with the time slots
        var slots = this.dateAvail() && this.dateAvail().getFreeTimeSlots(requiredDurationMinutes, undefined, includeEndTime) || [];
        // Iterate to organize by group
        slots.forEach(function(slot) {
            slot = moment(slot).tz(tz);
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
        this.timeZone('');
        this.specialTimeZones.removeAll();
        this.isTimeZonePickerOpen(false);
    }.bind(this);

    this.bindDateData = function (date) {

        if (!date || !this.userID()) return;

        var tz = this.timeZone();

        this.isLoading(true);

        var s = this.getDateAtTimeZone(date, tz);
        var e = s.clone().add(1, 'day');
        return availability.times(this.userID(), s, e)
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
            app.modals.showError({
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

    // Auto bind date data on selecte time zone change:
    this.timeZone.subscribe(function() {
        this.bindDateData(this.selectedDate());
    }.bind(this));

    // On Setting the data, we need to refresh tags,
    // and on change userID. This runs too the first time
    // update.
    ko.computed(function() {
        if (this.dateAvail() && this.userID()) {
            // Once finished, load the whole month
            this.tagAvailability(this.selectedDate(), this.userID());
        }
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 60 } });

    // Force first refresh on datepicker to allow
    // event handlers to get notified on first time:
    $datePicker.datepicker('fill');

    var autoTz = timeZoneList.getUsAliasWhenPossible(timeZoneList.getLocalTimeZone());
    var autoLabel = 'Auto (' + timeZoneList.timeZoneToDisplayFormat(autoTz) + ')';
    this.autoTimeZone = ko.observable({
        id: autoTz,
        label: autoLabel
    });
    this.timeZonesList = ko.observable(timeZoneList.getUserList());
    this.topUsTimeZones = ko.observable(timeZoneList.getTopUsZones());

    this.isTimeZonePickerOpen = ko.observable(false);
    this.openTimeZonePicker = function() {
        this.isTimeZonePickerOpen(true);
    };
}

module.exports = DatetimePickerVM;
