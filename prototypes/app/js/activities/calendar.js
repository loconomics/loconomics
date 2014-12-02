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

var ko = require('knockout');
var CalendarSlot = require('../models/CalendarSlot');

CalendarActivity.prototype.showDailyView = function showDailyView(date, firstRun) {

    if (firstRun || !this.$dailyView.is(':visible')) {
        this.$appointmentView.hide();
        this.$dailyView.show();
    }
   
    // Optional date, or maintain current one
    if (date && date instanceof Date) {
        this.updateDateTitle(date);
    }
    
    if (!this.__initedDailyView) {
        this.__initedDailyView = true;
        
        // Data
        var testData1 = [
            new CalendarSlot({
                startTime: new Date(2014, 11, 1, 0, 0, 0),
                endTime: new Date(2014, 11, 1, 12, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 1, 12, 0, 0),
                endTime: new Date(2014, 11, 1, 13, 0, 0),
                
                subject: 'Josh Danielson',
                description: 'Deep Tissue Massage',
                link: '#calendar/appointment/3',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 1, 13, 0, 0),
                endTime: new Date(2014, 11, 1, 15, 0, 0),

                subject: 'Do that important thing',
                description: null,
                link: '#calendar/event/8',

                actionIcon: 'glyphicon glyphicon-new-window',
                actionText: null,

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 1, 15, 0, 0),
                endTime: new Date(2014, 11, 1, 16, 0, 0),
                
                subject: 'Iago Lorenzo',
                description: 'Deep Tissue Massage Long Name',
                link: '#calendar/appointment/5',

                actionIcon: null,
                actionText: '$159.90',

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 1, 16, 0, 0),
                endTime: new Date(2014, 11, 2, 0, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            })
        ];
        var testData2 = [
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 0, 0, 0),
                endTime: new Date(2014, 11, 2, 9, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 9, 0, 0),
                endTime: new Date(2014, 11, 2, 10, 0, 0),
                
                subject: 'Jaren Freely',
                description: 'Deep Tissue Massage Long Name',
                link: '#calendar/appointment/1',

                actionIcon: null,
                actionText: '$59.90',

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 10, 0, 0),
                endTime: new Date(2014, 11, 2, 11, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 11, 0, 0),
                endTime: new Date(2014, 11, 2, 12, 45, 0),
                
                subject: 'CONFIRM-Susan Dee',
                description: 'Deep Tissue Massage',
                link: '#calendar/appointment/2',

                actionIcon: null,
                actionText: '$70',

                classNames: 'ListView-item--tag-warning'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 12, 45, 0),
                endTime: new Date(2014, 11, 2, 16, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 16, 0, 0),
                endTime: new Date(2014, 11, 2, 17, 15, 0),
                
                subject: 'Susan Dee',
                description: 'Deep Tissue Massage',
                link: '#calendar/appointment/3',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 17, 15, 0),
                endTime: new Date(2014, 11, 2, 18, 30, 0),
                
                subject: 'Dentist appointment',
                description: null,
                link: '#calendar/event/4',

                actionIcon: 'glyphicon glyphicon-new-window',
                actionText: null,

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 18, 30, 0),
                endTime: new Date(2014, 11, 2, 19, 30, 0),
                
                subject: 'Susan Dee',
                description: 'Deep Tissue Massage Long Name',
                link: '#calendar/appointment/5',

                actionIcon: null,
                actionText: '$159.90',

                classNames: null
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 19, 30, 0),
                endTime: new Date(2014, 11, 2, 23, 0, 0),
                
                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            }),
            new CalendarSlot({
                startTime: new Date(2014, 11, 2, 23, 0, 0),
                endTime: new Date(2014, 11, 3, 0, 0, 0),

                subject: 'Jaren Freely',
                description: 'Deep Tissue Massage',
                link: '#calendar/appointment/6',

                actionIcon: null,
                actionText: '$80',

                classNames: null
            })
        ];
        var testDataFree = [
            new CalendarSlot({
                startTime: new Date(2014, 0, 1, 0, 0, 0),
                endTime: new Date(2014, 0, 2, 0, 0, 0),

                subject: 'Free',
                description: null,
                link: '#calendar/new',

                actionIcon: 'glyphicon glyphicon-plus',
                actionText: null,

                classNames: 'ListView-item--tag-success'
            })
        ];
        
        var testData = {
            '2014-12-01': testData1,
            '2014-12-02': testData2,
            'default': testDataFree
        };
        
        var dailyDataView = {
            slots: ko.observableArray(testData2),
            currentIndex: ko.observable(0)
        };
        
        ko.applyBindings(dailyDataView, this.$dailyView.get(0));
        
        this.$datepicker.on('changeDate', function(e) {
            if (e.viewMode === 'days') {
                var date = moment(e.date);
                var sdate = date.format('YYYY-MM-DD');
                
                if (testData.hasOwnProperty(sdate)) {
                    dailyDataView.slots(testData[sdate]);
                } else {
                    dailyDataView.slots(testData['default']);
                }
            }
        }.bind(this));
    }
};


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
            if (this.currentIndex() === 0)
                this.currentIndex(this.appointments().length - 1);
            else
                this.currentIndex((this.currentIndex() - 1) % this.appointments().length);
        };
        appointmentsDataView.goNext = function goNext() {
            this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
        };
        
        ko.applyBindings(appointmentsDataView, this.$appointmentView.get(0));
    }
};
