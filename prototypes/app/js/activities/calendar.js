/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');
require('../components/DatePicker');

exports.init = function initCalendar($activity) {
    var calendar = new CalendarActivity($activity);
};

function CalendarActivity($activity) {

    /* Getting elements */
    this.$datepicker = $activity.find('#calendarDatePicker');
    this.$dailyView = $activity.find('#calendarDailyView');
    this.$dateHeader = $activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$appointmentView = $activity.find('#calendarAppointmentView');
    this.$chooseNew = $activity.find('#calendarChooseNew');
    
    /* Init components */
    this.$datepicker.show().datepicker();

    /* Event handlers */
    this.$datepicker
    .on('swipeleft', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveDate', 'next');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveDate', 'prev');
    }.bind(this));

    this.$datepicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            this.showDailyView(e.date);
        }
    }.bind(this));

    this.$dailyView
    .on('swipeleft', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveValue', 'next', 'date');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveValue', 'prev', 'date');
    }.bind(this));
    
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

    this.$dateTitle.on('tap', function(e) {
        this.$datepicker.toggleClass('is-visible');
        e.preventDefault();
        e.stopPropagation();
    }.bind(this));
    
    $activity.on('tap', '[data-toggle="activity"][data-target="calendar-appointment"]', function(e) {
        this.$chooseNew.modal('hide');
        this.showAppointment();
        e.preventDefault();
    }.bind(this));
    
    /* Visualization */
    // Start with daily view and initial date:
    this.showDailyView(this.$datepicker.datepicker('getValue'), true);
};

CalendarActivity.prototype.updateDateTitle = function updateDateTitle(date) {
    date = moment(date);
    var dateInfo = this.$dateTitle.children('time:eq(0)');
    dateInfo.attr('datetime', date.toISOString());
    dateInfo.text(date.format('dddd (M/D)'));
    this.$datepicker.removeClass('is-visible');
};

CalendarActivity.prototype.showDailyView = function showDailyView(date, firstRun) {

    if (firstRun || !this.$dailyView.is(':visible')) {
        this.$appointmentView.hide();
        this.$dailyView.show();
    }
   
    // Optional date, or maintain current one
    if (date && date instanceof Date) {
        this.updateDateTitle(date);
    }

};

var ko = require('knockout');
var Appointment = require('../models/Appointment');

CalendarActivity.prototype.showAppointment = function showAppointment() {
    
    // Visualization:
    this.$dailyView.hide();
    this.$appointmentView.show();
    
    if (!this.__initedAppointment) {
        this.__initedAppointment = true;
        // Data
        var testData = [
            new Appointment({
                startTime: new Date(2014, 11, 1, 10, 0, 0),
                endTime: new Date(2014, 11, 1, 12, 0, 0),
                pricingSummary: 'Deep Tissue Massage 120m plus 2 more',
                ptotalPrice: 95.0,
                locationSummary: '3150 18th Street San Francisco, CA',
                notesToClient: 'Looking forward to seeing the new color',
                notesToSelf: 'Ask him about his new color',
                client: {
                    firstName: 'Joshua',
                    lastName: 'Danielson'
                }
            }),
            new Appointment({
                startTime: new Date(2014, 11, 1, 13, 0, 0),
                endTime: new Date(2014, 11, 1, 13, 50, 0),
                pricingSummary: 'Another Massage 50m',
                ptotalPrice: 95.0,
                locationSummary: '3150 18th Street San Francisco, CA',
                notesToClient: 'Something else',
                notesToSelf: 'Remember that thing',
                client: {
                    firstName: 'Joshua',
                    lastName: 'Danielson'
                }
            }),
            new Appointment({
                startTime: new Date(2014, 11, 1, 16, 0, 0),
                endTime: new Date(2014, 11, 1, 18, 0, 0),
                pricingSummary: 'Tissue Massage 120m',
                ptotalPrice: 95.0,
                locationSummary: '3150 18th Street San Francisco, CA',
                notesToClient: '',
                notesToSelf: 'Ask him about the forgotten notes',
                client: {
                    firstName: 'Joshua',
                    lastName: 'Danielson'
                }
            }),
        ];
        var appointmentsDataView = {
            appointments: ko.observableArray(testData),
            currentIndex: ko.observable(0)
        };
        appointmentsDataView.currentAppointment = ko.computed(function() {
            return this.appointments()[this.currentIndex() % this.appointments().length];
        }, appointmentsDataView);
        appointmentsDataView.goPrevious = function goPrevious() {
            this.currentIndex(Math.abs(this.currentIndex() - 1) % this.appointments().length);
        };
        appointmentsDataView.goNext = function goNext() {
            this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
        };
        
        ko.applyBindings(appointmentsDataView, this.$appointmentView.get(0));
    }
};
