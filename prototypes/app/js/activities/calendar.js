/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');
require('../components/DatePicker');
var ko = require('knockout');
var CalendarSlot = require('../models/CalendarSlot');

var singleton = null;

exports.init = function initCalendar($activity, app) {

    if (singleton === null)
        singleton = new CalendarActivity($activity, app);
    
    return singleton;
};

function CalendarActivity($activity, app) {

    /* Getting elements */
    this.$activity = $activity;
    this.$datepicker = $activity.find('#calendarDatePicker');
    this.$dailyView = $activity.find('#calendarDailyView');
    this.$dateHeader = $activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$chooseNew = $('#calendarChooseNew');
    this.app = app;
    
    /* Init components */
    this.$datepicker.show().datepicker();
    this.currentDate = ko.observable();
    
    // Data
    var slotsData = require('../testdata/calendarSlots').calendar;
    this.dailyDataView = {
        slots: ko.observableArray([]),
        slotsData: slotsData
    };

    ko.applyBindings(this.dailyDataView, this.$dailyView.get(0));

    /* Event handlers */
    // date change
    this.currentDate.subscribe(function(date) {
        this.updateDateTitle(date);
        this.bindDateData(date);
    }.bind(this));
    
    // Swipe date on gesture
    this.$dailyView
    .on('swipeleft', function(e) {
        e.preventDefault();
        // Hack to solve the freezy-swipe and tap-after bug on JQM:
        $(document).trigger('touchend');
        // Change date
        this.$datepicker.datepicker('moveValue', 'next', 'date');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        // Hack to solve the freezy-swipe and tap-after bug on JQM:
        $(document).trigger('touchend');
        // Change date
        this.$datepicker.datepicker('moveValue', 'prev', 'date');
    }.bind(this));
    
    // Changing date with buttons:
    this.$dateHeader.on('tap', '.CalendarDateHeader-switch', function(e) {
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
    }.bind(this));

    // Showing datepicker when pressing the title
    this.$dateTitle.on('tap', function(e) {
        this.$datepicker.toggleClass('is-visible');
        e.preventDefault();
        e.stopPropagation();
    }.bind(this));
    
    $activity.on('tap', '[data-target="new-booking"]', function(e) {
        this.$chooseNew.modal('hide');
        this.showAppointment(null);
        e.preventDefault();
    }.bind(this));
    
    this.$datepicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            this.currentDate(e.date);
        }
    }.bind(this));

    this.$dailyView.on('tap', '.ListView-item a', function(e) {

        var link = e.currentTarget.getAttribute('href');
        if (/^#calendar\/appointment/i.test(link)) {
            this.$chooseNew.modal('hide');
            // TODO: Must pass the appointment instead a fake non-null
            this.showAppointment({});
        }
        else if (/^#calendar\/new/i.test(link)) {
            this.$chooseNew.modal('show');
        }

        e.preventDefault();
    }.bind(this));
    
    // Set date to match datepicker for first update
    this.currentDate(this.$datepicker.datepicker('getValue'));
}

CalendarActivity.prototype.show = function show(options) {
    
    if (options && (options.date instanceof Date))
        this.currentDate(options.date);
};

CalendarActivity.prototype.updateDateTitle = function updateDateTitle(date) {
    date = moment(date);
    var dateInfo = this.$dateTitle.children('time:eq(0)');
    dateInfo.attr('datetime', date.toISOString());
    dateInfo.text(date.format('dddd (M/D)'));
    this.$datepicker.removeClass('is-visible');
    // Change not from the widget?
    if (this.$datepicker.datepicker('getValue').toISOString() !== date.toISOString())
        this.$datepicker.datepicker('setValue', date, true);
};

CalendarActivity.prototype.bindDateData = function bindDateData(date) {
    
    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.dailyDataView.slotsData;
    
    if (slotsData.hasOwnProperty(sdate)) {
        this.dailyDataView.slots(slotsData[sdate]);
    } else {
        this.dailyDataView.slots(slotsData['default']);
    }
};

CalendarActivity.prototype.showAppointment = function showAppointment(apt) {
    
    this.app.showActivity('appointment', {
        date: this.currentDate()
    });
};

