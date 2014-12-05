;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    this.$activity = $activity;
    this.$datepicker = $activity.find('#calendarDatePicker');
    this.$dailyView = $activity.find('#calendarDailyView');
    this.$dateHeader = $activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$appointmentView = $activity.find('#calendarAppointmentView');
    this.$chooseNew = $activity.find('#calendarChooseNew');
    
    /* Init components */
    this.$datepicker.show().datepicker();

    /* Event handlers */
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

CalendarActivity.prototype.bindDateData = function bindDateData(date) {
    
    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.dailyDataView.slotsData;
    
    if (slotsData.hasOwnProperty(sdate)) {
        this.dailyDataView.slots(slotsData[sdate]);
    } else {
        this.dailyDataView.slots(slotsData['default']);
    }
};

var ko = require('knockout');
var CalendarSlot = require('../models/CalendarSlot');

CalendarActivity.prototype.showDailyView = function showDailyView(date, firstRun) {

    if (firstRun || !this.$dailyView.is(':visible')) {
        this.$appointmentView.hide();
        this.$dailyView.show();
    }

    if (!this.__initedDailyView) {
        this.__initedDailyView = true;
        
        // Data
        var slotsData = require('../testdata/calendarSlots').calendar;
        
        this.dailyDataView = {
            slots: ko.observableArray([]),
            slotsData: slotsData
        };
        
        ko.applyBindings(this.dailyDataView, this.$dailyView.get(0));
        
        // Events
        this.$datepicker.on('changeDate', function(e) {
            if (e.viewMode === 'days') {
                this.showDailyView(e.date);
            }
        }.bind(this));
        
        this.$dailyView.on('tap', '.ListView-item a', function(e) {

            var link = e.currentTarget.getAttribute('href');
            if (/^#calendar\/appointment/i.test(link)) {
                this.$chooseNew.modal('hide');
                this.showAppointment();
            }
            else if (/^#calendar\/new/i.test(link)) {
                this.$chooseNew.modal('show');
            }

            e.preventDefault();
        }.bind(this));
    }
    
    // Optional date, or maintain current one
    if (date && date instanceof Date) {
        this.updateDateTitle(date);
        this.bindDateData(date);
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
        var testData = require('../testdata/calendarAppointments').appointments;
        var appointmentsDataView = {
            appointments: ko.observableArray(testData),
            currentIndex: ko.observable(0),
            editMode: ko.observable(false),
            isNew: ko.observable(false)
        };
        appointmentsDataView.currentAppointment = ko.computed(function() {
            return this.appointments()[this.currentIndex() % this.appointments().length];
        }, appointmentsDataView);
 
        appointmentsDataView.goPrevious = function goPrevious() {
            if (this.editMode()) return;
        
            if (this.currentIndex() === 0)
                this.currentIndex(this.appointments().length - 1);
            else
                this.currentIndex((this.currentIndex() - 1) % this.appointments().length);
        };
        
        appointmentsDataView.goNext = function goNext() {
            if (this.editMode()) return;

            this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
        };

        appointmentsDataView.edit = function edit() {
            this.editMode(true);
        }.bind(appointmentsDataView);
        
        appointmentsDataView.cancel = function cancel() {
            this.editMode(false);
        }.bind(appointmentsDataView);
        
        appointmentsDataView.editMode.subscribe(function(isEdit) {
            
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);
            
        }.bind(this));
        
        ko.applyBindings(appointmentsDataView, this.$appointmentView.get(0));
    }
};

},{"../components/DatePicker":4,"../models/Appointment":5,"../models/CalendarSlot":6,"../testdata/calendarAppointments":9,"../testdata/calendarSlots":10,"knockout":false,"moment":false}],2:[function(require,module,exports){
/**
    datetimePicker activity
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    Time = require('../utils/Time');
require('../components/DatePicker');

exports.init = function initDatetimePicker($activity) {
    var calendar = new DatetimePickerActivity($activity);
};

function DatetimePickerActivity($activity) {

    this.$activity = $activity;
    this.$datePicker = $activity.find('#datetimePickerDatePicker');
    this.$timePicker = $activity.find('#datetimePickerTimePicker');

    /* Init components */
    this.$datePicker.show().datepicker();
    
    var dataView = this.dataView = new ViewModel();
    dataView.headerText = 'Select a start time';
    ko.applyBindings(dataView, $activity.get(0));
    
    // Events
    this.$datePicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            dataView.selectedDate(e.date);
        }
    }.bind(this));
    
    // TestingData
    dataView.slotsData = require('../testdata/timeSlots').timeSlots;
 
    dataView.selectedDate.subscribe(function(date) {
        this.bindDateData(date);
    }.bind(this));

    this.bindDateData(new Date());
}

DatetimePickerActivity.prototype.bindDateData = function bindDateData(date) {

    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.dataView.slotsData;

    if (slotsData.hasOwnProperty(sdate)) {
        this.dataView.slots(slotsData[sdate]);
    } else {
        this.dataView.slots(slotsData['default']);
    }
};

function ViewModel() {

    this.headerText = ko.observable('Select a time');
    this.selectedDate = ko.observable(new Date());
    this.slotsData = {};
    this.slots = ko.observableArray([]);
    this.groupedSlots = ko.computed(function(){
        /*
          before 12:00pm (noon) = morning
          afternoon: 12:00pm until 5:00pm
          evening: 5:00pm - 11:59pm
        */
        // Since slots must be for the same date,
        // to define the groups ranges use the first date
        var datePart = this.slots() && this.slots()[0] || new Date();
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
        var slots = this.slots().sort();
        slots.forEach(function(slot) {
            groups.forEach(function(group) {
                if (slot >= group.starts &&
                    slot < group.ends) {
                    group.slots.push(slot);
                }
            });
        });

        return groups;

    }, this);

}

},{"../components/DatePicker":4,"../testdata/timeSlots":11,"../utils/Time":12,"knockout":false,"moment":false}],3:[function(require,module,exports){
'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('../vendor/iagosrl/ko/formatBinding').formatBinding;

/** Load activities **/
var activities = {
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker')
};

/** Page ready **/
$(function() {
    // Detect activities loaded in the current document
    // and initialize them:
    $('[data-activity]').each(function() {
        var $activity = $(this);
        var actName = $activity.data('activity');
        if (activities.hasOwnProperty(actName)) {
            activities[actName].init($activity);
        }
    });
});

},{"../vendor/iagosrl/ko/formatBinding":14,"./activities/calendar":1,"./activities/datetimePicker":2,"knockout":false}],4:[function(require,module,exports){
/* =========================================================
 * DatePicker JS Component, with several
 * modes and optional inline-permanent visualization.
 *
 * Copyright 2014 Loconomics Coop.
 *
 * Based on:
 * bootstrap-datepicker.js 
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

var $ = require('jquery'); 

var classes = {
    component: 'DatePicker',
    months: 'DatePicker-months',
    days: 'DatePicker-days',
    monthDay: 'day',
    month: 'month',
    year: 'year',
    years: 'DatePicker-years'
};

// Picker object
var DatePicker = function(element, options) {
    /*jshint maxstatements:32,maxcomplexity:24*/
    this.element = $(element);
    this.format = DPGlobal.parseFormat(options.format||this.element.data('date-format')||'mm/dd/yyyy');
    
    this.isInput = this.element.is('input');
    this.component = this.element.is('.date') ? this.element.find('.add-on') : false;
    this.isPlaceholder = this.element.is('.calendar-placeholder');
    
    this.picker = $(DPGlobal.template)
                        .appendTo(this.isPlaceholder ? this.element : 'body')
                        .on('click tap', $.proxy(this.click, this));
    // TODO: to review if 'container' class can be avoided, so in placeholder mode gets optional
    // if is wanted can be placed on the placeholder element (or container-fluid or nothing)
    this.picker.addClass(this.isPlaceholder ? 'container' : 'dropdown-menu');
    
    if (this.isPlaceholder) {
        this.picker.show();
        if (this.element.data('date') == 'today') {
            this.date = new Date();
            this.set();
        }
        this.element.trigger({
            type: 'show',
            date: this.date
        });
    }
    else if (this.isInput) {
        this.element.on({
            focus: $.proxy(this.show, this),
            //blur: $.proxy(this.hide, this),
            keyup: $.proxy(this.update, this)
        });
    } else {
        if (this.component){
            this.component.on('click tap', $.proxy(this.show, this));
        } else {
            this.element.on('click tap', $.proxy(this.show, this));
        }
    }
    
    /* Touch events to swipe dates */
    this.element
    .on('swipeleft', function(e) {
        e.preventDefault();
        this.moveDate('next');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        this.moveDate('prev');
    }.bind(this));

    /* Set-up view mode */
    this.minViewMode = options.minViewMode||this.element.data('date-minviewmode')||0;
    if (typeof this.minViewMode === 'string') {
        switch (this.minViewMode) {
            case 'months':
                this.minViewMode = 1;
                break;
            case 'years':
                this.minViewMode = 2;
                break;
            default:
                this.minViewMode = 0;
                break;
        }
    }
    this.viewMode = options.viewMode||this.element.data('date-viewmode')||0;
    if (typeof this.viewMode === 'string') {
        switch (this.viewMode) {
            case 'months':
                this.viewMode = 1;
                break;
            case 'years':
                this.viewMode = 2;
                break;
            default:
                this.viewMode = 0;
                break;
        }
    }
    this.startViewMode = this.viewMode;
    this.weekStart = options.weekStart||this.element.data('date-weekstart')||0;
    this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;
    this.onRender = options.onRender;
    this.fillDow();
    this.fillMonths();
    this.update();
    this.showMode();
};

DatePicker.prototype = {
    constructor: DatePicker,
    
    show: function(e) {
        this.picker.show();
        this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
        this.place();
        $(window).on('resize', $.proxy(this.place, this));
        if (e ) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!this.isInput) {
        }
        var that = this;
        $(document).on('mousedown', function(ev){
            if ($(ev.target).closest('.' + classes.component).length === 0) {
                that.hide();
            }
        });
        this.element.trigger({
            type: 'show',
            date: this.date
        });
    },
    
    hide: function(){
        this.picker.hide();
        $(window).off('resize', this.place);
        this.viewMode = this.startViewMode;
        this.showMode();
        if (!this.isInput) {
            $(document).off('mousedown', this.hide);
        }
        //this.set();
        this.element.trigger({
            type: 'hide',
            date: this.date
        });
    },
    
    set: function() {
        var formated = DPGlobal.formatDate(this.date, this.format);
        if (!this.isInput) {
            if (this.component){
                this.element.find('input').prop('value', formated);
            }
            this.element.data('date', formated);
        } else {
            this.element.prop('value', formated);
        }
    },
    
    setValue: function(newDate) {
        if (typeof newDate === 'string') {
            this.date = DPGlobal.parseDate(newDate, this.format);
        } else {
            this.date = new Date(newDate);
        }
        this.set();
        this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1, 0, 0, 0, 0);
        this.fill();
        // Notify:
        this.element.trigger({
            type: 'changeDate',
            date: this.date,
            viewMode: DPGlobal.modes[this.viewMode].clsName
        });
    },
    
    getValue: function() {
        return this.date;
    },
    
    moveValue: function(dir, mode) {
        // dir can be: 'prev', 'next'
        if (['prev', 'next'].indexOf(dir && dir.toLowerCase()) == -1)
            // No valid option:
            return;

        // default mode is the current one
        mode = mode ?
            DPGlobal.modesSet[mode] :
            DPGlobal.modes[this.viewMode];

        this.date['set' + mode.navFnc].call(
            this.date,
            this.date['get' + mode.navFnc].call(this.date) + 
            mode.navStep * (dir === 'prev' ? -1 : 1)
        );
        this.setValue(this.date);
        return this.date;
    },
    
    place: function(){
        var offset = this.component ? this.component.offset() : this.element.offset();
        this.picker.css({
            top: offset.top + this.height,
            left: offset.left
        });
    },
    
    update: function(newDate){
        this.date = DPGlobal.parseDate(
            typeof newDate === 'string' ? newDate : (this.isInput ? this.element.prop('value') : this.element.data('date')),
            this.format
        );
        this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1, 0, 0, 0, 0);
        this.fill();
    },
    
    fillDow: function(){
        var dowCnt = this.weekStart;
        var html = '<tr>';
        while (dowCnt < this.weekStart + 7) {
            html += '<th class="dow">'+DPGlobal.dates.daysMin[(dowCnt++)%7]+'</th>';
        }
        html += '</tr>';
        this.picker.find('.' + classes.days + ' thead').append(html);
    },
    
    fillMonths: function(){
        var html = '';
        var i = 0;
        while (i < 12) {
            html += '<span class="' + classes.month + '">'+DPGlobal.dates.monthsShort[i++]+'</span>';
        }
        this.picker.find('.' + classes.months + ' td').append(html);
    },
    
    fill: function() {
        /*jshint maxstatements:66, maxcomplexity:28*/
        var d = new Date(this.viewDate),
            year = d.getFullYear(),
            month = d.getMonth(),
            currentDate = this.date.valueOf();
        this.picker
        .find('.' + classes.days + ' th:eq(1)')
        .html(DPGlobal.dates.months[month] + ' ' + year);
        var prevMonth = new Date(year, month-1, 28,0,0,0,0),
            day = DPGlobal.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
        prevMonth.setDate(day);
        prevMonth.setDate(day - (prevMonth.getDay() - this.weekStart + 7)%7);
        var nextMonth = new Date(prevMonth);
        nextMonth.setDate(nextMonth.getDate() + 42);
        nextMonth = nextMonth.valueOf();
        var html = [];
        var clsName,
            prevY,
            prevM;
            
        if (this._daysCreated !== true) {
            // Create html (first time only)
       
            while(prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getDay() === this.weekStart) {
                    html.push('<tr>');
                }
                clsName = this.onRender(prevMonth);
                prevY = prevMonth.getFullYear();
                prevM = prevMonth.getMonth();
                if ((prevM < month &&  prevY === year) ||  prevY < year) {
                    clsName += ' old';
                } else if ((prevM > month && prevY === year) || prevY > year) {
                    clsName += ' new';
                }
                if (prevMonth.valueOf() === currentDate) {
                    clsName += ' active';
                }
                html.push('<td class="' + classes.monthDay + ' ' + clsName+'">'+prevMonth.getDate() + '</td>');
                if (prevMonth.getDay() === this.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setDate(prevMonth.getDate()+1);
            }
            
            this.picker.find('.' + classes.days + ' tbody').empty().append(html.join(''));
            this._daysCreated = true;
        }
        else {
            // Update days values
            
            var weekTr = this.picker.find('.' + classes.days + ' tbody tr:first-child()');
            var dayTd = null;
            while(prevMonth.valueOf() < nextMonth) {
                var currentWeekDayIndex = prevMonth.getDay() - this.weekStart;

                clsName = this.onRender(prevMonth);
                prevY = prevMonth.getFullYear();
                prevM = prevMonth.getMonth();
                if ((prevM < month &&  prevY === year) ||  prevY < year) {
                    clsName += ' old';
                } else if ((prevM > month && prevY === year) || prevY > year) {
                    clsName += ' new';
                }
                if (prevMonth.valueOf() === currentDate) {
                    clsName += ' active';
                }
                //html.push('<td class="day '+clsName+'">'+prevMonth.getDate() + '</td>');
                dayTd = weekTr.find('td:eq(' + currentWeekDayIndex + ')');
                dayTd
                .attr('class', 'day ' + clsName)
                .text(prevMonth.getDate());
                
                // Next week?
                if (prevMonth.getDay() === this.weekEnd) {
                    weekTr = weekTr.next('tr');
                }
                prevMonth.setDate(prevMonth.getDate()+1);
            }
        }

        var currentYear = this.date.getFullYear();
        
        var months = this.picker.find('.' + classes.months)
                    .find('th:eq(1)')
                        .html(year)
                        .end()
                    .find('span').removeClass('active');
        if (currentYear === year) {
            months.eq(this.date.getMonth()).addClass('active');
        }
        
        html = '';
        year = parseInt(year/10, 10) * 10;
        var yearCont = this.picker.find('.' + classes.years)
                            .find('th:eq(1)')
                                .text(year + '-' + (year + 9))
                                .end()
                            .find('td');
        
        year -= 1;
        var i;
        if (this._yearsCreated !== true) {

            for (i = -1; i < 11; i++) {
                html += '<span class="' + classes.year + (i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
                year += 1;
            }
            
            yearCont.html(html);
            this._yearsCreated = true;
        }
        else {
            
            var yearSpan = yearCont.find('span:first-child()');
            for (i = -1; i < 11; i++) {
                //html += '<span class="year'+(i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
                yearSpan
                .text(year)
                .attr('class', 'year' + (i === -1 || i === 10 ? ' old' : '') + (currentYear === year ? ' active' : ''));
                year += 1;
                yearSpan = yearSpan.next();
            }
        }
    },
    
    moveDate: function(dir, mode) {
        // dir can be: 'prev', 'next'
        if (['prev', 'next'].indexOf(dir && dir.toLowerCase()) == -1)
            // No valid option:
            return;
            
        // default mode is the current one
        mode = mode || this.viewMode;

        this.viewDate['set'+DPGlobal.modes[mode].navFnc].call(
            this.viewDate,
            this.viewDate['get'+DPGlobal.modes[mode].navFnc].call(this.viewDate) + 
            DPGlobal.modes[mode].navStep * (dir === 'prev' ? -1 : 1)
        );
        this.fill();
        this.set();
    },

    click: function(e) {
        /*jshint maxcomplexity:16*/
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.target).closest('span, td, th');
        if (target.length === 1) {
            var month, year;
            switch(target[0].nodeName.toLowerCase()) {
                case 'th':
                    switch(target[0].className) {
                        case 'switch':
                            this.showMode(1);
                            break;
                        case 'prev':
                        case 'next':
                            this.moveDate(target[0].className);
                            break;
                    }
                    break;
                case 'span':
                    if (target.is('.' + classes.month)) {
                        month = target.parent().find('span').index(target);
                        this.viewDate.setMonth(month);
                    } else {
                        year = parseInt(target.text(), 10)||0;
                        this.viewDate.setFullYear(year);
                    }
                    if (this.viewMode !== 0) {
                        this.date = new Date(this.viewDate);
                        this.element.trigger({
                            type: 'changeDate',
                            date: this.date,
                            viewMode: DPGlobal.modes[this.viewMode].clsName
                        });
                    }
                    this.showMode(-1);
                    this.fill();
                    this.set();
                    break;
                case 'td':
                    if (target.is('.day') && !target.is('.disabled')){
                        var day = parseInt(target.text(), 10)||1;
                        month = this.viewDate.getMonth();
                        if (target.is('.old')) {
                            month -= 1;
                        } else if (target.is('.new')) {
                            month += 1;
                        }
                        year = this.viewDate.getFullYear();
                        this.date = new Date(year, month, day,0,0,0,0);
                        this.viewDate = new Date(year, month, Math.min(28, day),0,0,0,0);
                        this.fill();
                        this.set();
                        this.element.trigger({
                            type: 'changeDate',
                            date: this.date,
                            viewMode: DPGlobal.modes[this.viewMode].clsName
                        });
                    }
                    break;
            }
        }
    },
    
    mousedown: function(e){
        e.stopPropagation();
        e.preventDefault();
    },
    
    showMode: function(dir) {
        if (dir) {
            this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
        }
        this.picker.find('>div').hide().filter('.' + classes.component + '-' + DPGlobal.modes[this.viewMode].clsName).show();
    }
};

$.fn.datepicker = function ( option ) {
    var vals = Array.prototype.slice.call(arguments, 1);
    var returned;
    this.each(function () {
        var $this = $(this),
            data = $this.data('datepicker'),
            options = typeof option === 'object' && option;
        if (!data) {
            $this.data('datepicker', (data = new DatePicker(this, $.extend({}, $.fn.datepicker.defaults,options))));
        }

        if (typeof option === 'string') {
            returned = data[option].apply(data, vals);
            // There is a value returned by the method?
            if (typeof(returned !== 'undefined')) {
                // Go out the loop to return the value from the first
                // element-method execution
                return false;
            }
            // Follow next loop item
        }
    });
    if (typeof(returned) !== 'undefined')
        return returned;
    else
        // chaining:
        return this;
};

$.fn.datepicker.defaults = {
    onRender: function(date) {
        return '';
    }
};
$.fn.datepicker.Constructor = DatePicker;

var DPGlobal = {
    modes: [
        {
            clsName: 'days',
            navFnc: 'Month',
            navStep: 1
        },
        {
            clsName: 'months',
            navFnc: 'FullYear',
            navStep: 1
        },
        {
            clsName: 'years',
            navFnc: 'FullYear',
            navStep: 10
        },
        {
            clsName: 'day',
            navFnc: 'Date',
            navStep: 1
        }
    ],
    dates:{
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    isLeapYear: function (year) {
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
    },
    getDaysInMonth: function (year, month) {
        return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },
    parseFormat: function(format){
        var separator = format.match(/[.\/\-\s].*?/),
            parts = format.split(/\W+/);
        if (!separator || !parts || parts.length === 0){
            throw new Error("Invalid date format.");
        }
        return {separator: separator, parts: parts};
    },
    parseDate: function(date, format) {
        /*jshint maxcomplexity:11*/
        var parts = date.split(format.separator),
            val;
        date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        if (parts.length === format.parts.length) {
            var year = date.getFullYear(), day = date.getDate(), month = date.getMonth();
            for (var i=0, cnt = format.parts.length; i < cnt; i++) {
                val = parseInt(parts[i], 10)||1;
                switch(format.parts[i]) {
                    case 'dd':
                    case 'd':
                        day = val;
                        date.setDate(val);
                        break;
                    case 'mm':
                    case 'm':
                        month = val - 1;
                        date.setMonth(val - 1);
                        break;
                    case 'yy':
                        year = 2000 + val;
                        date.setFullYear(2000 + val);
                        break;
                    case 'yyyy':
                        year = val;
                        date.setFullYear(val);
                        break;
                }
            }
            date = new Date(year, month, day, 0 ,0 ,0);
        }
        return date;
    },
    formatDate: function(date, format){
        var val = {
            d: date.getDate(),
            m: date.getMonth() + 1,
            yy: date.getFullYear().toString().substring(2),
            yyyy: date.getFullYear()
        };
        val.dd = (val.d < 10 ? '0' : '') + val.d;
        val.mm = (val.m < 10 ? '0' : '') + val.m;
        date = [];
        for (var i=0, cnt = format.parts.length; i < cnt; i++) {
            date.push(val[format.parts[i]]);
        }
        return date.join(format.separator);
    },
    headTemplate: '<thead>'+
                        '<tr>'+
                            '<th class="prev">&lsaquo;</th>'+
                            '<th colspan="5" class="switch"></th>'+
                            '<th class="next">&rsaquo;</th>'+
                        '</tr>'+
                    '</thead>',
    contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>'
};
DPGlobal.template = '<div class="' + classes.component + '">'+
                        '<div class="' + classes.days + '">'+
                            '<table class=" table-condensed">'+
                                DPGlobal.headTemplate+
                                '<tbody></tbody>'+
                            '</table>'+
                        '</div>'+
                        '<div class="' + classes.months + '">'+
                            '<table class="table-condensed">'+
                                DPGlobal.headTemplate+
                                DPGlobal.contTemplate+
                            '</table>'+
                        '</div>'+
                        '<div class="' + classes.years + '">'+
                            '<table class="table-condensed">'+
                                DPGlobal.headTemplate+
                                DPGlobal.contTemplate+
                            '</table>'+
                        '</div>'+
                    '</div>';
DPGlobal.modesSet = {
    'date': DPGlobal.modes[3],
    'month': DPGlobal.modes[0],
    'year': DPGlobal.modes[1],
    'decade': DPGlobal.modes[2]
};

/** Public API **/
exports.DatePicker = DatePicker;
exports.defaults = DPGlobal;
exports.utils = DPGlobal;

},{}],5:[function(require,module,exports){
/** Appointment model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client');

function Appointment(values) {
    
    Model(this);
    
    this.model.defProperties({
        startTime: null,
        endTime: null,
        
        subtotalPrice: 0,
        feePrice: 0,
        pfeePrice: 0,
        totalPrice: 0,
        ptotalPrice: 0,
        
        pricing: {}, // TODO future Pricing model
        pricingSummary: '', // TODO Future computed from pricing fields
        
        location: {}, // TODO future Location model
        locationSummary: '', // TODO Future computed from location fields
        
        notesToClient: '',
        notesToSelf: ''
    }, values);

    this.client = ko.observable(new Client(values.client));
}

module.exports = Appointment;

},{"./Client":7,"./Model":8,"knockout":false}],6:[function(require,module,exports){
/** CalendarSlot model.

    Describes a time slot in the calendar, for a consecutive
    event, appointment or free time.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client');

function CalendarSlot(values) {
    
    Model(this);

    this.model.defProperties({
        startTime: null,
        endTime: null,
        
        subject: '',
        description: null,
        link: '#',

        actionIcon: null,
        actionText: null,
        
        classNames: ''

    }, values);
}

module.exports = CalendarSlot;

},{"./Client":7,"./Model":8,"knockout":false}],7:[function(require,module,exports){
/** Client model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Client(values) {
    
    Model(this);
    
    this.model.defProperties({
        firstName: '',
        lastName: ''
    }, values);

    this.fullName = ko.computed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
}

module.exports = Client;

},{"./Model":8,"knockout":false}],8:[function(require,module,exports){
/**
    Model class to help build models.

    Is not exactly an 'OOP base' class, but provides
    utilities to models and a model definition object
    when executed in their constructors as:
    
    '''
    function MyModel() {
        Model(this);
        // Now, there is a this.model property with
        // an instance of the Model class, with 
        // utilities and model settings.
    }
    '''
    
    That auto creation of 'model' property can be avoided
    when using the object instantiation syntax ('new' keyword):
    
    '''
    var model = new Model(obj);
    // There is no a 'obj.model' property, can be
    // assigned to whatever property or nothing.
    '''
**/
'use strict';
var ko = require('knockout');

function Model(modelObject) {
    
    if (!(this instanceof Model)) {
        // Executed as a function, it must create
        // a Model instance
        var model = new Model(modelObject);
        // and register automatically as part
        // of the modelObject in 'model' property
        modelObject.model = model;
        
        // Returns the instance
        return model;
    }
    
    this.modelObject = modelObject;
}

module.exports = Model;

/**
    Define observable properties using the given
    properties object definition that includes de default values,
    and some optional initialValues (normally that is provided externally
    as a parameter to the model constructor, while default values are
    set in the constructor).
    That properties become members of the modelObject, simplifying 
    model definitions.
    
    It uses Knockout.observable and observableArray, so properties
    are funtions that reads the value when no arguments or sets when
    one argument is passed of.
**/
Model.prototype.defProperties = function defProperties(properties, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject;
    Object.keys(properties).forEach(function(key) {
        
        var defVal = properties[key];
        // Create observable property with default value
        modelObject[key] = Array.isArray(defVal) ?
            ko.observableArray(defVal) :
            ko.observable(defVal);
        // Remember default
        modelObject[key]._defaultValue = defVal;
        
        // If there is an initialValue, set it:
        if (typeof(initialValues[key]) !== 'undefined') {
            modelObject[key](initialValues[key]);
        }
    });
};

/**
    Define fields as plain members of the modelObject using
    the fields object definition that includes default values,
    and some optional initialValues.
    
    Its like defProperties, but for plain js values rather than observables.
**/
Model.prototype.defFields = function defFields(fields, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject;
    Object.keys(properties).each(function(key) {
        
        var defVal = properties[key];
        // Create field with default value
        modelObject[key] = defVal;
        
        // If there is an initialValue, set it:
        if (typeof(initialValues[key]) !== 'undefined') {
            modelObject[key] = initialValues[key];
        }
    });    
};

},{"knockout":false}],9:[function(require,module,exports){
/** Calendar Appointments test data **/
var Appointment = require('../models/Appointment');

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

exports.appointments = testData;

},{"../models/Appointment":5}],10:[function(require,module,exports){
/** Calendar Slots test data **/
var CalendarSlot = require('../models/CalendarSlot');

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

exports.calendar = testData;

},{"../models/CalendarSlot":6}],11:[function(require,module,exports){
/** 
    timeSlots
    testing data
**/

var Time = require('../utils/Time');

var moment = require('moment');

var today = new Date(),
    tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

var stoday = moment(today).format('YYYY-MM-DD'),
    stomorrow = moment(tomorrow).format('YYYY-MM-DD');

var testData1 = [
    Time(today, 9, 15),
    Time(today, 11, 30),
    Time(today, 12, 0),
    Time(today, 12, 30),
    Time(today, 16, 15),
    Time(today, 18, 0),
    Time(today, 18, 30),
    Time(today, 19, 0),
    Time(today, 19, 30),
    Time(today, 21, 30),
    Time(today, 22, 0)
];

var testData2 = [
    Time(tomorrow, 8, 0),
    Time(tomorrow, 10, 30),
    Time(tomorrow, 11, 0),
    Time(tomorrow, 11, 30),
    Time(tomorrow, 12, 0),
    Time(tomorrow, 12, 30),
    Time(tomorrow, 13, 0),
    Time(tomorrow, 13, 30),
    Time(tomorrow, 14, 45),
    Time(tomorrow, 16, 0),
    Time(tomorrow, 16, 30)
];

var testDataBusy = [
];

var testData = {
    'default': testDataBusy
};
testData[stoday] = testData1;
testData[stomorrow] = testData2;

exports.timeSlots = testData;

},{"../utils/Time":12,"moment":false}],12:[function(require,module,exports){
/**
    Time class utility.
    Shorter way to create a Date instance
    specifying only the Time part,
    defaulting to current date or 
    another ready date instance.
**/
function Time(date, hour, minute, second) {
    if (!(date instanceof Date)) {
 
        second = minute;
        minute = hour;
        hour = date;
        
        date = new Date();   
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour || 0, minute || 0, second || 0);
}
module.exports = Time;

},{}],13:[function(require,module,exports){
/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.5.3',
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',
        zeroFormat = null,
        defaultFormat = '0,0',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._value = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;
            
        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (languages[currentLanguage].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(languages[currentLanguage].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 0; power <= suffixes.length; power++) {
                    bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) * Number(string.replace(/[^0-9\.]+/g, ''));

                // round if we are talking about bytes
                n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
            }
        }
        return n._value;
    }

    function formatCurrency (n, format, roundingFunction) {
        var symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            minusSignIndex = format.indexOf('-'),
            space = '',
            spliceIndex,
            output;

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        output = formatNumber(n._value, format, roundingFunction);

        // position the symbol
        if (symbolIndex <= 1) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                spliceIndex = 1;
                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex){
                    // the symbol appears before the "(" or "-"
                    spliceIndex = 0;
                }
                output.splice(spliceIndex, 0, languages[currentLanguage].currency.symbol + space);
                output = output.join('');
            } else {
                output = languages[currentLanguage].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + languages[currentLanguage].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);
        
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime (n) {
        var hours = Math.floor(n._value/60/60),
            minutes = Math.floor((n._value - (hours * 60 * 60))/60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (value, format, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            } else if (format.indexOf('+') > -1) {
                signed = true;
                format = format.replace(/\+/g, '');
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check if abbreviation is specified
                abbrK = format.indexOf('aK') >= 0;
                abbrM = format.indexOf('aM') >= 0;
                abbrB = format.indexOf('aB') >= 0;
                abbrT = format.indexOf('aT') >= 0;
                abbrForce = abbrK || abbrM || abbrB || abbrT;

                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + languages[currentLanguage].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + languages[currentLanguage].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                for (power = 0; power <= suffixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (value >= min && value < max) {
                        bytes = bytes + suffixes[power];
                        if (min > 0) {
                            value = value / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + languages[currentLanguage].ordinal(value);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            w = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(value, null, roundingFunction);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    numeral.language = function (key, values) {
        if (!key) {
            return currentLanguage;
        }

        if (key && !values) {
            if(!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            currentLanguage = key;
        }

        if (values || !languages[key]) {
            loadLanguage(key, values);
        }

        return numeral;
    };
    
    // This function provides access to the loaded language data.  If
    // no arguments are passed in, it will simply return the current
    // global language object.
    numeral.languageData = function (key) {
        if (!key) {
            return languages[currentLanguage];
        }
        
        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }
        
        return languages[key];
    };

    numeral.language('en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    numeral.zeroFormat = function (format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numeral.defaultFormat = function (format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    /************************************
        Helpers
    ************************************/

    function loadLanguage(key, values) {
        languages[key] = values;
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function (callback, opt_initialValue) {
            'use strict';
            
            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
            
            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = opt_initialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }

    
    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function (prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
        return mp > mn ? mp : mn;
        }, -Infinity);
    }        


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (inputString, roundingFunction) {
            return formatNumeral(this, 
                  inputString ? inputString : defaultFormat, 
                  (roundingFunction !== undefined) ? roundingFunction : Math.round
              );
        },

        unformat : function (inputString) {
            if (Object.prototype.toString.call(inputString) === '[object Number]') { 
                return inputString; 
            }
            return unformatNumeral(this, inputString ? inputString : defaultFormat);
        },

        value : function () {
            return this._value;
        },

        valueOf : function () {
            return this._value;
        },

        set : function (value) {
            this._value = Number(value);
            return this;
        },

        add : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;            
            return this;
        },

        multiply : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) * (curr * corrFactor) /
                    (corrFactor * corrFactor);
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);            
            return this;
        },

        difference : function (value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }
}).call(this);

},{}],14:[function(require,module,exports){
/* jshint maxcomplexity:14 */
/**
    Format extender for Knockout observables.
**/
'use strict';

var ko = require('knockout');
var $ = require('jquery');

/**
    The extender types are defined externally and registered
    in 'types' with each property the name of the type and the value
    the function implementing it.
**/
exports.types = {};

/**
    Knockout extender, to attach to ko.extenders with the desired
    name (for example: 'type' :-)
**/
exports.formatBinding = {
    update: function(element, valueAccessor, allBindings) {

        var options = ko.unwrap(valueAccessor()),
            value = ko.unwrap(allBindings.get('text'));
            
        applyFormat(value, element, options, ko.dataFor(element));

    }
};

function applyFormat(value, element, options, dataContext) {

    var type = ko.unwrap(options.type);

    if (type && value && type in exports.types) {

        var typeFormatter = exports.types[type];
        var str = typeFormatter.format(value, options, ko.dataFor(element));

        if ('html' in typeFormatter && typeFormatter.html === true)
            $(element).html(str);
        else
            $(element).text(str);
    }
}

/** Definition of several types */ 
exports.types.link = {
    html: true,
    format: function LinkFormatter(value, def, dataContext) {
    
        var link = def ? def.link ? def.link : def : null;
        link = typeof(link) === 'string' ? link : null;
        var r = value;
        
        if (link) {
            r = $('<a/>');
            
            var title = def ? def.title ? def.title : null : null,
                target = def ? def.target ? def.target : null : null;
            
            r.attr('href', link.replace(/__value__/g, value));
            if (title)
                r.attr('title', title.replace(/__value__/g, value));
            if (target)
                r.attr('target', target);
                
            // TODO: dataContext placeholders
            
            if (def.contentFormat) {
                applyFormat(value, r, def.contentFormat, dataContext);
            }
            else {
                r.text(value);
            }
            
            r = r.outerHtml();
        }

        return r;
    }
};

var moment = require('moment');
exports.types.datetime = {
    format: function DateTimeFormatter(value, def, dataContext) {
        var moment = require('moment');
        
        if (!value)
            return def.default || def.invalid || '';
        
        var dt = moment(value);
        return dt.isValid() ? dt.format(def.format) : def.invalid || '';
    }
};
    
exports.types.concat = {
    format: function ConcatFormatter(value, def, dataContext) {

        var fields = $.map(def.format, function(v, i) {
            // If is not a literal (between comiles), is a field
            // we need the value from the source and put it in the list
            var match = /["'](.*)["']/.exec(v);
            if (match && match.length > 1)
                return match[1];
            else
                return dataContext[v];
        });

        return fields.join('');
    }
};

var numeral = require('numeral');    
exports.types.number = {
    format: function NumberFormatter(value, def, dataContext) {
        var numeral = require('numeral');
        return numeral(value).format(def.format);
    }
};
    
exports.types.bool = {
    format: function BoolFormatter(value, def, dataContext) {
        var vs = def.values;
        if (!vs || vs.length !== 2)
            vs = ['true', 'false'];

        return value ? vs[0] : vs[1];
    }
};

},{"knockout":false,"moment":false,"numeral":13}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9kYXRldGltZVBpY2tlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL2pzL21vZGVscy9BcHBvaW50bWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL0NhbGVuZGFyU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL0NsaWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvdGVzdGRhdGEvY2FsZW5kYXJTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvdGVzdGRhdGEvdGltZVNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9qcy91dGlscy9UaW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9ub2RlX21vZHVsZXMvbnVtZXJhbC9udW1lcmFsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC92ZW5kb3IvaWFnb3NybC9rby9mb3JtYXRCaW5kaW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENhbGVuZGFyKCRhY3Rpdml0eSkge1xyXG4gICAgdmFyIGNhbGVuZGFyID0gbmV3IENhbGVuZGFyQWN0aXZpdHkoJGFjdGl2aXR5KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyQWN0aXZpdHkoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlcGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJGRhaWx5VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZUhlYWRlcicpO1xyXG4gICAgdGhpcy4kZGF0ZVRpdGxlID0gdGhpcy4kZGF0ZUhlYWRlci5jaGlsZHJlbignLkNhbGVuZGFyRGF0ZUhlYWRlci1kYXRlJyk7XHJcbiAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyQXBwb2ludG1lbnRWaWV3Jyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICBcclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG5cclxuICAgIC8qIEV2ZW50IGhhbmRsZXJzICovXHJcbiAgICB0aGlzLiRkYWlseVZpZXdcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsICduZXh0JywgJ2RhdGUnKTtcclxuICAgIH0uYmluZCh0aGlzKSlcclxuICAgIC5vbignc3dpcGVyaWdodCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyLm9uKCd0YXAnLCAnLkNhbGVuZGFyRGF0ZUhlYWRlci1zd2l0Y2gnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc3dpdGNoIChlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykpIHtcclxuICAgICAgICAgICAgY2FzZSAnI3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMuJGRhdGVUaXRsZS5vbigndGFwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIudG9nZ2xlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgICRhY3Rpdml0eS5vbigndGFwJywgJ1tkYXRhLXRvZ2dsZT1cImFjdGl2aXR5XCJdW2RhdGEtdGFyZ2V0PVwiY2FsZW5kYXItYXBwb2ludG1lbnRcIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy4kY2hvb3NlTmV3Lm1vZGFsKCdoaWRlJyk7XHJcbiAgICAgICAgdGhpcy5zaG93QXBwb2ludG1lbnQoKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvKiBWaXN1YWxpemF0aW9uICovXHJcbiAgICAvLyBTdGFydCB3aXRoIGRhaWx5IHZpZXcgYW5kIGluaXRpYWwgZGF0ZTpcclxuICAgIHRoaXMuc2hvd0RhaWx5Vmlldyh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJyksIHRydWUpO1xyXG59O1xyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUudXBkYXRlRGF0ZVRpdGxlID0gZnVuY3Rpb24gdXBkYXRlRGF0ZVRpdGxlKGRhdGUpIHtcclxuICAgIGRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcbiAgICB2YXIgZGF0ZUluZm8gPSB0aGlzLiRkYXRlVGl0bGUuY2hpbGRyZW4oJ3RpbWU6ZXEoMCknKTtcclxuICAgIGRhdGVJbmZvLmF0dHIoJ2RhdGV0aW1lJywgZGF0ZS50b0lTT1N0cmluZygpKTtcclxuICAgIGRhdGVJbmZvLnRleHQoZGF0ZS5mb3JtYXQoJ2RkZGQgKE0vRCknKSk7XHJcbiAgICB0aGlzLiRkYXRlcGlja2VyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbn07XHJcblxyXG5DYWxlbmRhckFjdGl2aXR5LnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG4gICAgXHJcbiAgICB2YXIgc2RhdGUgPSBtb21lbnQoZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcbiAgICB2YXIgc2xvdHNEYXRhID0gdGhpcy5kYWlseURhdGFWaWV3LnNsb3RzRGF0YTtcclxuICAgIFxyXG4gICAgaWYgKHNsb3RzRGF0YS5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICB0aGlzLmRhaWx5RGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhW3NkYXRlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGFpbHlEYXRhVmlldy5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgQ2FsZW5kYXJTbG90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU2xvdCcpO1xyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvd0RhaWx5VmlldyA9IGZ1bmN0aW9uIHNob3dEYWlseVZpZXcoZGF0ZSwgZmlyc3RSdW4pIHtcclxuXHJcbiAgICBpZiAoZmlyc3RSdW4gfHwgIXRoaXMuJGRhaWx5Vmlldy5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy4kZGFpbHlWaWV3LnNob3coKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWREYWlseVZpZXcpIHtcclxuICAgICAgICB0aGlzLl9faW5pdGVkRGFpbHlWaWV3ID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHNsb3RzRGF0YSA9IHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMnKS5jYWxlbmRhcjtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmRhaWx5RGF0YVZpZXcgPSB7XHJcbiAgICAgICAgICAgIHNsb3RzOiBrby5vYnNlcnZhYmxlQXJyYXkoW10pLFxyXG4gICAgICAgICAgICBzbG90c0RhdGE6IHNsb3RzRGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhaWx5RGF0YVZpZXcsIHRoaXMuJGRhaWx5Vmlldy5nZXQoMCkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEV2ZW50c1xyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0RhaWx5VmlldyhlLmRhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLiRkYWlseVZpZXcub24oJ3RhcCcsICcuTGlzdFZpZXctaXRlbSBhJywgZnVuY3Rpb24oZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGxpbmsgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICAgICAgICAgIGlmICgvXiNjYWxlbmRhclxcL2FwcG9pbnRtZW50L2kudGVzdChsaW5rKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kY2hvb3NlTmV3Lm1vZGFsKCdoaWRlJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKC9eI2NhbGVuZGFyXFwvbmV3L2kudGVzdChsaW5rKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kY2hvb3NlTmV3Lm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBPcHRpb25hbCBkYXRlLCBvciBtYWludGFpbiBjdXJyZW50IG9uZVxyXG4gICAgaWYgKGRhdGUgJiYgZGF0ZSBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZURhdGVUaXRsZShkYXRlKTtcclxuICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgIH1cclxufTtcclxuXHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxuXHJcbkNhbGVuZGFyQWN0aXZpdHkucHJvdG90eXBlLnNob3dBcHBvaW50bWVudCA9IGZ1bmN0aW9uIHNob3dBcHBvaW50bWVudCgpIHtcclxuICAgIFxyXG4gICAgLy8gVmlzdWFsaXphdGlvbjpcclxuICAgIHRoaXMuJGRhaWx5Vmlldy5oaWRlKCk7XHJcbiAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcuc2hvdygpO1xyXG4gICAgXHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWRBcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMuX19pbml0ZWRBcHBvaW50bWVudCA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIERhdGFcclxuICAgICAgICB2YXIgdGVzdERhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cycpLmFwcG9pbnRtZW50cztcclxuICAgICAgICB2YXIgYXBwb2ludG1lbnRzRGF0YVZpZXcgPSB7XHJcbiAgICAgICAgICAgIGFwcG9pbnRtZW50czoga28ub2JzZXJ2YWJsZUFycmF5KHRlc3REYXRhKSxcclxuICAgICAgICAgICAgY3VycmVudEluZGV4OiBrby5vYnNlcnZhYmxlKDApLFxyXG4gICAgICAgICAgICBlZGl0TW9kZToga28ub2JzZXJ2YWJsZShmYWxzZSksXHJcbiAgICAgICAgICAgIGlzTmV3OiBrby5vYnNlcnZhYmxlKGZhbHNlKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcG9pbnRtZW50cygpW3RoaXMuY3VycmVudEluZGV4KCkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aF07XHJcbiAgICAgICAgfSwgYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29QcmV2aW91cyA9IGZ1bmN0aW9uIGdvUHJldmlvdXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSArIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXQgPSBmdW5jdGlvbiBlZGl0KCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlLnN1YnNjcmliZShmdW5jdGlvbihpc0VkaXQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuJGFjdGl2aXR5LnRvZ2dsZUNsYXNzKCdpbi1lZGl0JywgaXNFZGl0KTtcclxuICAgICAgICAgICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3LmZpbmQoJy5BcHBvaW50bWVudENhcmQnKS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyhhcHBvaW50bWVudHNEYXRhVmlldywgdGhpcy4kYXBwb2ludG1lbnRWaWV3LmdldCgwKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdERhdGV0aW1lUGlja2VyKCRhY3Rpdml0eSkge1xyXG4gICAgdmFyIGNhbGVuZGFyID0gbmV3IERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG5cclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAgZGF0YVZpZXcuaGVhZGVyVGV4dCA9ICdTZWxlY3QgYSBzdGFydCB0aW1lJztcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICAvLyBFdmVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgZGF0YVZpZXcuc2xvdHNEYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvdGltZVNsb3RzJykudGltZVNsb3RzO1xyXG4gXHJcbiAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5iaW5kRGF0ZURhdGEobmV3IERhdGUoKSk7XHJcbn1cclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLmJpbmREYXRlRGF0YSA9IGZ1bmN0aW9uIGJpbmREYXRlRGF0YShkYXRlKSB7XHJcblxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhO1xyXG5cclxuICAgIGlmIChzbG90c0RhdGEuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2VsZWN0IGEgdGltZScpO1xyXG4gICAgdGhpcy5zZWxlY3RlZERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSB7fTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5ncm91cGVkU2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBiZWZvcmUgMTI6MDBwbSAobm9vbikgPSBtb3JuaW5nXHJcbiAgICAgICAgICBhZnRlcm5vb246IDEyOjAwcG0gdW50aWwgNTowMHBtXHJcbiAgICAgICAgICBldmVuaW5nOiA1OjAwcG0gLSAxMTo1OXBtXHJcbiAgICAgICAgKi9cclxuICAgICAgICAvLyBTaW5jZSBzbG90cyBtdXN0IGJlIGZvciB0aGUgc2FtZSBkYXRlLFxyXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgZ3JvdXBzIHJhbmdlcyB1c2UgdGhlIGZpcnN0IGRhdGVcclxuICAgICAgICB2YXIgZGF0ZVBhcnQgPSB0aGlzLnNsb3RzKCkgJiYgdGhpcy5zbG90cygpWzBdIHx8IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdNb3JuaW5nJyxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0czogbmV3IFRpbWUoZGF0ZVBhcnQsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDEyLCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0FmdGVybm9vbicsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnRXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxNywgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMjQsIDApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHMoKS5zb3J0KCk7XHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xvdCA+PSBncm91cC5zdGFydHMgJiZcclxuICAgICAgICAgICAgICAgICAgICBzbG90IDwgZ3JvdXAuZW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG5cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKiogR2xvYmFsIGRlcGVuZGVuY2llcyAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LW1vYmlsZScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5iaW5kaW5nSGFuZGxlcnMuZm9ybWF0ID0gcmVxdWlyZSgnLi4vdmVuZG9yL2lhZ29zcmwva28vZm9ybWF0QmluZGluZycpLmZvcm1hdEJpbmRpbmc7XHJcblxyXG4vKiogTG9hZCBhY3Rpdml0aWVzICoqL1xyXG52YXIgYWN0aXZpdGllcyA9IHtcclxuICAgICdjYWxlbmRhcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhcicpLFxyXG4gICAgJ2RhdGV0aW1lUGlja2VyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2RhdGV0aW1lUGlja2VyJylcclxufTtcclxuXHJcbi8qKiBQYWdlIHJlYWR5ICoqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gRGV0ZWN0IGFjdGl2aXRpZXMgbG9hZGVkIGluIHRoZSBjdXJyZW50IGRvY3VtZW50XHJcbiAgICAvLyBhbmQgaW5pdGlhbGl6ZSB0aGVtOlxyXG4gICAgJCgnW2RhdGEtYWN0aXZpdHldJykuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGFjdGl2aXR5ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3Rpdml0eS5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIGlmIChhY3Rpdml0aWVzLmhhc093blByb3BlcnR5KGFjdE5hbWUpKSB7XHJcbiAgICAgICAgICAgIGFjdGl2aXRpZXNbYWN0TmFtZV0uaW5pdCgkYWN0aXZpdHkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIERhdGVQaWNrZXIgSlMgQ29tcG9uZW50LCB3aXRoIHNldmVyYWxcclxuICogbW9kZXMgYW5kIG9wdGlvbmFsIGlubGluZS1wZXJtYW5lbnQgdmlzdWFsaXphdGlvbi5cclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQgTG9jb25vbWljcyBDb29wLlxyXG4gKlxyXG4gKiBCYXNlZCBvbjpcclxuICogYm9vdHN0cmFwLWRhdGVwaWNrZXIuanMgXHJcbiAqIGh0dHA6Ly93d3cuZXllY29uLnJvL2Jvb3RzdHJhcC1kYXRlcGlja2VyXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBDb3B5cmlnaHQgMjAxMiBTdGVmYW4gUGV0cmVcclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpOyBcclxuXHJcbnZhciBjbGFzc2VzID0ge1xyXG4gICAgY29tcG9uZW50OiAnRGF0ZVBpY2tlcicsXHJcbiAgICBtb250aHM6ICdEYXRlUGlja2VyLW1vbnRocycsXHJcbiAgICBkYXlzOiAnRGF0ZVBpY2tlci1kYXlzJyxcclxuICAgIG1vbnRoRGF5OiAnZGF5JyxcclxuICAgIG1vbnRoOiAnbW9udGgnLFxyXG4gICAgeWVhcjogJ3llYXInLFxyXG4gICAgeWVhcnM6ICdEYXRlUGlja2VyLXllYXJzJ1xyXG59O1xyXG5cclxuLy8gUGlja2VyIG9iamVjdFxyXG52YXIgRGF0ZVBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6MzIsbWF4Y29tcGxleGl0eToyNCovXHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gICAgdGhpcy5mb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmZvcm1hdHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0Jyl8fCdtbS9kZC95eXl5Jyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNJbnB1dCA9IHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKTtcclxuICAgIHRoaXMuY29tcG9uZW50ID0gdGhpcy5lbGVtZW50LmlzKCcuZGF0ZScpID8gdGhpcy5lbGVtZW50LmZpbmQoJy5hZGQtb24nKSA6IGZhbHNlO1xyXG4gICAgdGhpcy5pc1BsYWNlaG9sZGVyID0gdGhpcy5lbGVtZW50LmlzKCcuY2FsZW5kYXItcGxhY2Vob2xkZXInKTtcclxuICAgIFxyXG4gICAgdGhpcy5waWNrZXIgPSAkKERQR2xvYmFsLnRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5pc1BsYWNlaG9sZGVyID8gdGhpcy5lbGVtZW50IDogJ2JvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xyXG4gICAgLy8gVE9ETzogdG8gcmV2aWV3IGlmICdjb250YWluZXInIGNsYXNzIGNhbiBiZSBhdm9pZGVkLCBzbyBpbiBwbGFjZWhvbGRlciBtb2RlIGdldHMgb3B0aW9uYWxcclxuICAgIC8vIGlmIGlzIHdhbnRlZCBjYW4gYmUgcGxhY2VkIG9uIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IChvciBjb250YWluZXItZmx1aWQgb3Igbm90aGluZylcclxuICAgIHRoaXMucGlja2VyLmFkZENsYXNzKHRoaXMuaXNQbGFjZWhvbGRlciA/ICdjb250YWluZXInIDogJ2Ryb3Bkb3duLW1lbnUnKTtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNQbGFjZWhvbGRlcikge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSA9PSAndG9kYXknKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5vbih7XHJcbiAgICAgICAgICAgIGZvY3VzOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXHJcbiAgICAgICAgICAgIC8vYmx1cjogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpLFxyXG4gICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5zaG93LCB0aGlzKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyogVG91Y2ggZXZlbnRzIHRvIHN3aXBlIGRhdGVzICovXHJcbiAgICB0aGlzLmVsZW1lbnRcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCduZXh0Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubW92ZURhdGUoJ3ByZXYnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLyogU2V0LXVwIHZpZXcgbW9kZSAqL1xyXG4gICAgdGhpcy5taW5WaWV3TW9kZSA9IG9wdGlvbnMubWluVmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLW1pbnZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWluVmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm1pblZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnZpZXdNb2RlID0gb3B0aW9ucy52aWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtdmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy52aWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMudmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XHJcbiAgICB0aGlzLndlZWtTdGFydCA9IG9wdGlvbnMud2Vla1N0YXJ0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKXx8MDtcclxuICAgIHRoaXMud2Vla0VuZCA9IHRoaXMud2Vla1N0YXJ0ID09PSAwID8gNiA6IHRoaXMud2Vla1N0YXJ0IC0gMTtcclxuICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyO1xyXG4gICAgdGhpcy5maWxsRG93KCk7XHJcbiAgICB0aGlzLmZpbGxNb250aHMoKTtcclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB0aGlzLnNob3dNb2RlKCk7XHJcbn07XHJcblxyXG5EYXRlUGlja2VyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBEYXRlUGlja2VyLFxyXG4gICAgXHJcbiAgICBzaG93OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCgpIDogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgdGhpcy5wbGFjZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XHJcbiAgICAgICAgaWYgKGUgKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldil7XHJcbiAgICAgICAgICAgIGlmICgkKGV2LnRhcmdldCkuY2xvc2VzdCgnLicgKyBjbGFzc2VzLmNvbXBvbmVudCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHRoaXMucGxhY2UpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XHJcbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZvcm1hdGVkID0gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKiBBcHBvaW50bWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByaWNpbmc6IHt9LCAvLyBUT0RPIGZ1dHVyZSBQcmljaW5nIG1vZGVsXHJcbiAgICAgICAgcHJpY2luZ1N1bW1hcnk6ICcnLCAvLyBUT0RPIEZ1dHVyZSBjb21wdXRlZCBmcm9tIHByaWNpbmcgZmllbGRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9jYXRpb246IHt9LCAvLyBUT0RPIGZ1dHVyZSBMb2NhdGlvbiBtb2RlbFxyXG4gICAgICAgIGxvY2F0aW9uU3VtbWFyeTogJycsIC8vIFRPRE8gRnV0dXJlIGNvbXB1dGVkIGZyb20gbG9jYXRpb24gZmllbGRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgbm90ZXNUb1NlbGY6ICcnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuY2xpZW50ID0ga28ub2JzZXJ2YWJsZShuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBvaW50bWVudDtcclxuIiwiLyoqIENhbGVuZGFyU2xvdCBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSB0aW1lIHNsb3QgaW4gdGhlIGNhbGVuZGFyLCBmb3IgYSBjb25zZWN1dGl2ZVxyXG4gICAgZXZlbnQsIGFwcG9pbnRtZW50IG9yIGZyZWUgdGltZS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJTbG90KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclNsb3Q7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJydcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5maXJzdE5hbWUoKSArICcgJyArIHRoaXMubGFzdE5hbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDbGllbnQ7XHJcbiIsIi8qKlxyXG4gICAgTW9kZWwgY2xhc3MgdG8gaGVscCBidWlsZCBtb2RlbHMuXHJcblxyXG4gICAgSXMgbm90IGV4YWN0bHkgYW4gJ09PUCBiYXNlJyBjbGFzcywgYnV0IHByb3ZpZGVzXHJcbiAgICB1dGlsaXRpZXMgdG8gbW9kZWxzIGFuZCBhIG1vZGVsIGRlZmluaXRpb24gb2JqZWN0XHJcbiAgICB3aGVuIGV4ZWN1dGVkIGluIHRoZWlyIGNvbnN0cnVjdG9ycyBhczpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICBmdW5jdGlvbiBNeU1vZGVsKCkge1xyXG4gICAgICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgICAgIC8vIE5vdywgdGhlcmUgaXMgYSB0aGlzLm1vZGVsIHByb3BlcnR5IHdpdGhcclxuICAgICAgICAvLyBhbiBpbnN0YW5jZSBvZiB0aGUgTW9kZWwgY2xhc3MsIHdpdGggXHJcbiAgICAgICAgLy8gdXRpbGl0aWVzIGFuZCBtb2RlbCBzZXR0aW5ncy5cclxuICAgIH1cclxuICAgICcnJ1xyXG4gICAgXHJcbiAgICBUaGF0IGF1dG8gY3JlYXRpb24gb2YgJ21vZGVsJyBwcm9wZXJ0eSBjYW4gYmUgYXZvaWRlZFxyXG4gICAgd2hlbiB1c2luZyB0aGUgb2JqZWN0IGluc3RhbnRpYXRpb24gc3ludGF4ICgnbmV3JyBrZXl3b3JkKTpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwob2JqKTtcclxuICAgIC8vIFRoZXJlIGlzIG5vIGEgJ29iai5tb2RlbCcgcHJvcGVydHksIGNhbiBiZVxyXG4gICAgLy8gYXNzaWduZWQgdG8gd2hhdGV2ZXIgcHJvcGVydHkgb3Igbm90aGluZy5cclxuICAgICcnJ1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZnVuY3Rpb24gTW9kZWwobW9kZWxPYmplY3QpIHtcclxuICAgIFxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVsKSkge1xyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGFzIGEgZnVuY3Rpb24sIGl0IG11c3QgY3JlYXRlXHJcbiAgICAgICAgLy8gYSBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChtb2RlbE9iamVjdCk7XHJcbiAgICAgICAgLy8gYW5kIHJlZ2lzdGVyIGF1dG9tYXRpY2FsbHkgYXMgcGFydFxyXG4gICAgICAgIC8vIG9mIHRoZSBtb2RlbE9iamVjdCBpbiAnbW9kZWwnIHByb3BlcnR5XHJcbiAgICAgICAgbW9kZWxPYmplY3QubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgIHJldHVybiBtb2RlbDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbE9iamVjdCA9IG1vZGVsT2JqZWN0O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgb2JzZXJ2YWJsZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBnaXZlblxyXG4gICAgcHJvcGVydGllcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcyAobm9ybWFsbHkgdGhhdCBpcyBwcm92aWRlZCBleHRlcm5hbGx5XHJcbiAgICBhcyBhIHBhcmFtZXRlciB0byB0aGUgbW9kZWwgY29uc3RydWN0b3IsIHdoaWxlIGRlZmF1bHQgdmFsdWVzIGFyZVxyXG4gICAgc2V0IGluIHRoZSBjb25zdHJ1Y3RvcikuXHJcbiAgICBUaGF0IHByb3BlcnRpZXMgYmVjb21lIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0LCBzaW1wbGlmeWluZyBcclxuICAgIG1vZGVsIGRlZmluaXRpb25zLlxyXG4gICAgXHJcbiAgICBJdCB1c2VzIEtub2Nrb3V0Lm9ic2VydmFibGUgYW5kIG9ic2VydmFibGVBcnJheSwgc28gcHJvcGVydGllc1xyXG4gICAgYXJlIGZ1bnRpb25zIHRoYXQgcmVhZHMgdGhlIHZhbHVlIHdoZW4gbm8gYXJndW1lbnRzIG9yIHNldHMgd2hlblxyXG4gICAgb25lIGFyZ3VtZW50IGlzIHBhc3NlZCBvZi5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmUHJvcGVydGllcyhwcm9wZXJ0aWVzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdDtcclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0oaW5pdGlhbFZhbHVlc1trZXldKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3Q7XHJcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5lYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWZWYWwgPSBwcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBkZWZWYWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgIH0pOyAgICBcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIEFwcG9pbnRtZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEyLCAwLCAwKSxcclxuICAgICAgICBwcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb25TdW1tYXJ5OiAnMzE1MCAxOHRoIFN0cmVldCBTYW4gRnJhbmNpc2NvLCBDQScsXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJ0xvb2tpbmcgZm9yd2FyZCB0byBzZWVpbmcgdGhlIG5ldyBjb2xvcicsXHJcbiAgICAgICAgbm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IGhpcyBuZXcgY29sb3InLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgNTAsIDApLFxyXG4gICAgICAgIHByaWNpbmdTdW1tYXJ5OiAnQW5vdGhlciBNYXNzYWdlIDUwbScsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb25TdW1tYXJ5OiAnMzE1MCAxOHRoIFN0cmVldCBTYW4gRnJhbmNpc2NvLCBDQScsXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBub3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvblN1bW1hcnk6ICczMTUwIDE4dGggU3RyZWV0IFNhbiBGcmFuY2lzY28sIENBJyxcclxuICAgICAgICBub3Rlc1RvQ2xpZW50OiAnJyxcclxuICAgICAgICBub3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgdGhlIGZvcmdvdHRlbiBub3RlcycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG5dO1xyXG5cclxuZXhwb3J0cy5hcHBvaW50bWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIENhbGVuZGFyIFNsb3RzIHRlc3QgZGF0YSAqKi9cclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTIsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNSwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB0aGF0IGltcG9ydGFudCB0aGluZycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9ldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2FwcG9pbnRtZW50LzUnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckMTU5LjkwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgOSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCA5LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxMSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDEyLCA0NSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0NPTkZJUk0tU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxNywgMTUsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9hcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxNywgMTUsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxOCwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdEZW50aXN0IGFwcG9pbnRtZW50JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2V2ZW50LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1uZXctd2luZG93JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDE4LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDE5LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9hcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTksIDMwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMjMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMjMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAzLCAwLCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0phcmVuIEZyZWVseScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2FwcG9pbnRtZW50LzYnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckODAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGFGcmVlID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAwLCAxLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAwLCAyLCAwLCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICcyMDE0LTEyLTAxJzogdGVzdERhdGExLFxyXG4gICAgJzIwMTQtMTItMDInOiB0ZXN0RGF0YTIsXHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhRnJlZVxyXG59O1xyXG5cclxuZXhwb3J0cy5jYWxlbmRhciA9IHRlc3REYXRhO1xyXG4iLCIvKiogXHJcbiAgICB0aW1lU2xvdHNcclxuICAgIHRlc3RpbmcgZGF0YVxyXG4qKi9cclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBUaW1lKHRvZGF5LCA5LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE2LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIxLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMiwgMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBUaW1lKHRvbW9ycm93LCA4LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEwLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNCwgNDUpLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDMwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhQnVzeSA9IFtcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFCdXN5XHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLnRpbWVTbG90cyA9IHRlc3REYXRhO1xyXG4iLCIvKipcclxuICAgIFRpbWUgY2xhc3MgdXRpbGl0eS5cclxuICAgIFNob3J0ZXIgd2F5IHRvIGNyZWF0ZSBhIERhdGUgaW5zdGFuY2VcclxuICAgIHNwZWNpZnlpbmcgb25seSB0aGUgVGltZSBwYXJ0LFxyXG4gICAgZGVmYXVsdGluZyB0byBjdXJyZW50IGRhdGUgb3IgXHJcbiAgICBhbm90aGVyIHJlYWR5IGRhdGUgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBUaW1lKGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XHJcbiAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcclxuIFxyXG4gICAgICAgIHNlY29uZCA9IG1pbnV0ZTtcclxuICAgICAgICBtaW51dGUgPSBob3VyO1xyXG4gICAgICAgIGhvdXIgPSBkYXRlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpOyAgIFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCksIGhvdXIgfHwgMCwgbWludXRlIHx8IDAsIHNlY29uZCB8fCAwKTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWU7XHJcbiIsIi8qIVxuICogbnVtZXJhbC5qc1xuICogdmVyc2lvbiA6IDEuNS4zXG4gKiBhdXRob3IgOiBBZGFtIERyYXBlclxuICogbGljZW5zZSA6IE1JVFxuICogaHR0cDovL2FkYW13ZHJhcGVyLmdpdGh1Yi5jb20vTnVtZXJhbC1qcy9cbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbnVtZXJhbCxcbiAgICAgICAgVkVSU0lPTiA9ICcxLjUuMycsXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcbiAgICAgICAgY3VycmVudExhbmd1YWdlID0gJ2VuJyxcbiAgICAgICAgemVyb0Zvcm1hdCA9IG51bGwsXG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSAnMCwwJyxcbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gTnVtZXJhbCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTnVtZXJhbCAobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHRvRml4ZWQoKSB0aGF0IHRyZWF0cyBmbG9hdHMgbW9yZSBsaWtlIGRlY2ltYWxzXG4gICAgICpcbiAgICAgKiBGaXhlcyBiaW5hcnkgcm91bmRpbmcgaXNzdWVzIChlZy4gKDAuNjE1KS50b0ZpeGVkKDIpID09PSAnMC42MScpIHRoYXQgcHJlc2VudFxuICAgICAqIHByb2JsZW1zIGZvciBhY2NvdW50aW5nLSBhbmQgZmluYW5jZS1yZWxhdGVkIHNvZnR3YXJlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvRml4ZWQgKHZhbHVlLCBwcmVjaXNpb24sIHJvdW5kaW5nRnVuY3Rpb24sIG9wdGlvbmFscykge1xuICAgICAgICB2YXIgcG93ZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSxcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCxcbiAgICAgICAgICAgIG91dHB1dDtcbiAgICAgICAgICAgIFxuICAgICAgICAvL3JvdW5kaW5nRnVuY3Rpb24gPSAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmQpO1xuICAgICAgICAvLyBNdWx0aXBseSB1cCBieSBwcmVjaXNpb24sIHJvdW5kIGFjY3VyYXRlbHksIHRoZW4gZGl2aWRlIGFuZCB1c2UgbmF0aXZlIHRvRml4ZWQoKTpcbiAgICAgICAgb3V0cHV0ID0gKHJvdW5kaW5nRnVuY3Rpb24odmFsdWUgKiBwb3dlcikgLyBwb3dlcikudG9GaXhlZChwcmVjaXNpb24pO1xuXG4gICAgICAgIGlmIChvcHRpb25hbHMpIHtcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCA9IG5ldyBSZWdFeHAoJzB7MSwnICsgb3B0aW9uYWxzICsgJ30kJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZShvcHRpb25hbHNSZWdFeHAsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gZGV0ZXJtaW5lIHdoYXQgdHlwZSBvZiBmb3JtYXR0aW5nIHdlIG5lZWQgdG8gZG9cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1lcmFsIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG91dHB1dDtcblxuICAgICAgICAvLyBmaWd1cmUgb3V0IHdoYXQga2luZCBvZiBmb3JtYXQgd2UgYXJlIGRlYWxpbmcgd2l0aFxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyQnKSA+IC0xKSB7IC8vIGN1cnJlbmN5ISEhISFcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdEN1cnJlbmN5KG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyUnKSA+IC0xKSB7IC8vIHBlcmNlbnRhZ2VcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFBlcmNlbnRhZ2UobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignOicpID4gLTEpIHsgLy8gdGltZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0VGltZShuLCBmb3JtYXQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBwbGFpbiBvbCcgbnVtYmVycyBvciBieXRlc1xuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmV0dXJuIHN0cmluZ1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8vIHJldmVydCB0byBudW1iZXJcbiAgICBmdW5jdGlvbiB1bmZvcm1hdE51bWVyYWwgKG4sIHN0cmluZykge1xuICAgICAgICB2YXIgc3RyaW5nT3JpZ2luYWwgPSBzdHJpbmcsXG4gICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCxcbiAgICAgICAgICAgIG1pbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBiaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IGZhbHNlLFxuICAgICAgICAgICAgcG93ZXI7XG5cbiAgICAgICAgaWYgKHN0cmluZy5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgICAgICAgbi5fdmFsdWUgPSB1bmZvcm1hdFRpbWUoc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmcgPT09IHplcm9Gb3JtYXQpIHtcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgIT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFwuL2csJycpLnJlcGxhY2UobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsLCAnLicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb25zIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBtaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGJ5dGVzIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IChzdHJpbmcuaW5kZXhPZihzdWZmaXhlc1twb3dlcl0pID4gLTEpID8gTWF0aC5wb3coMTAyNCwgcG93ZXIgKyAxKSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChieXRlc011bHRpcGxpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZSBtYXRoIHRvIGNyZWF0ZSBvdXIgbnVtYmVyXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoKGJ5dGVzTXVsdGlwbGllcikgPyBieXRlc011bHRpcGxpZXIgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godGhvdXNhbmRSZWdFeHApKSA/IE1hdGgucG93KDEwLCAzKSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChtaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgNikgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2goYmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDkpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRyaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMTIpIDogMSkgKiAoKHN0cmluZy5pbmRleE9mKCclJykgPiAtMSkgPyAwLjAxIDogMSkgKiAoKChzdHJpbmcuc3BsaXQoJy0nKS5sZW5ndGggKyBNYXRoLm1pbihzdHJpbmcuc3BsaXQoJygnKS5sZW5ndGgtMSwgc3RyaW5nLnNwbGl0KCcpJykubGVuZ3RoLTEpKSAlIDIpPyAxOiAtMSkgKiBOdW1iZXIoc3RyaW5nLnJlcGxhY2UoL1teMC05XFwuXSsvZywgJycpKTtcblxuICAgICAgICAgICAgICAgIC8vIHJvdW5kIGlmIHdlIGFyZSB0YWxraW5nIGFib3V0IGJ5dGVzXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoYnl0ZXNNdWx0aXBsaWVyKSA/IE1hdGguY2VpbChuLl92YWx1ZSkgOiBuLl92YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbi5fdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3kgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3ltYm9sSW5kZXggPSBmb3JtYXQuaW5kZXhPZignJCcpLFxuICAgICAgICAgICAgb3BlblBhcmVuSW5kZXggPSBmb3JtYXQuaW5kZXhPZignKCcpLFxuICAgICAgICAgICAgbWludXNTaWduSW5kZXggPSBmb3JtYXQuaW5kZXhPZignLScpLFxuICAgICAgICAgICAgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIHNwbGljZUluZGV4LFxuICAgICAgICAgICAgb3V0cHV0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgb3IgYWZ0ZXIgY3VycmVuY3lcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJCcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAkJywgJycpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCckICcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQgJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JtYXQgdGhlIG51bWJlclxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG5cbiAgICAgICAgLy8gcG9zaXRpb24gdGhlIHN5bWJvbFxuICAgICAgICBpZiAoc3ltYm9sSW5kZXggPD0gMSkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcoJykgPiAtMSB8fCBvdXRwdXQuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMTtcbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9sSW5kZXggPCBvcGVuUGFyZW5JbmRleCB8fCBzeW1ib2xJbmRleCA8IG1pbnVzU2lnbkluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN5bWJvbCBhcHBlYXJzIGJlZm9yZSB0aGUgXCIoXCIgb3IgXCItXCJcbiAgICAgICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKHNwbGljZUluZGV4LCAwLCBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHNwYWNlID0gJycsXG4gICAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgICB2YWx1ZSA9IG4uX3ZhbHVlICogMTAwO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgJVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAlJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICUnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJScsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcih2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEgKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyAnJScpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyAnJSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUgKG4pIHtcbiAgICAgICAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihuLl92YWx1ZS82MC82MCksXG4gICAgICAgICAgICBtaW51dGVzID0gTWF0aC5mbG9vcigobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkvNjApLFxuICAgICAgICAgICAgc2Vjb25kcyA9IE1hdGgucm91bmQobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKChtaW51dGVzIDwgMTApID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKChzZWNvbmRzIDwgMTApID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0VGltZSAoc3RyaW5nKSB7XG4gICAgICAgIHZhciB0aW1lQXJyYXkgPSBzdHJpbmcuc3BsaXQoJzonKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSAwO1xuICAgICAgICAvLyB0dXJuIGhvdXJzIGFuZCBtaW51dGVzIGludG8gc2Vjb25kcyBhbmQgYWRkIHRoZW0gYWxsIHVwXG4gICAgICAgIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAvLyBob3Vyc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCAqIDYwKTtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMV0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzJdKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE51bWJlcihzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1iZXIgKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG5lZ1AgPSBmYWxzZSxcbiAgICAgICAgICAgIHNpZ25lZCA9IGZhbHNlLFxuICAgICAgICAgICAgb3B0RGVjID0gZmFsc2UsXG4gICAgICAgICAgICBhYmJyID0gJycsXG4gICAgICAgICAgICBhYmJySyA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdGhvdXNhbmRzXG4gICAgICAgICAgICBhYmJyTSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gbWlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJCID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBiaWxsaW9uc1xuICAgICAgICAgICAgYWJiclQgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRyaWxsaW9uc1xuICAgICAgICAgICAgYWJickZvcmNlID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgYnl0ZXMgPSAnJyxcbiAgICAgICAgICAgIG9yZCA9ICcnLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnModmFsdWUpLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIG1pbixcbiAgICAgICAgICAgIG1heCxcbiAgICAgICAgICAgIHBvd2VyLFxuICAgICAgICAgICAgdyxcbiAgICAgICAgICAgIHByZWNpc2lvbixcbiAgICAgICAgICAgIHRob3VzYW5kcyxcbiAgICAgICAgICAgIGQgPSAnJyxcbiAgICAgICAgICAgIG5lZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIG51bWJlciBpcyB6ZXJvIGFuZCBhIGN1c3RvbSB6ZXJvIGZvcm1hdCBoYXMgYmVlbiBzZXRcbiAgICAgICAgaWYgKHZhbHVlID09PSAwICYmIHplcm9Gb3JtYXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIHNob3VsZCB1c2UgcGFyZW50aGVzZXMgZm9yIG5lZ2F0aXZlIG51bWJlciBvciBpZiB3ZSBzaG91bGQgcHJlZml4IHdpdGggYSBzaWduXG4gICAgICAgICAgICAvLyBpZiBib3RoIGFyZSBwcmVzZW50IHdlIGRlZmF1bHQgdG8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignKCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBuZWdQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQuc2xpY2UoMSwgLTEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignKycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBzaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKC9cXCsvZywgJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9uIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFiYnJldmlhdGlvbiBpcyBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBhYmJySyA9IGZvcm1hdC5pbmRleE9mKCdhSycpID49IDA7XG4gICAgICAgICAgICAgICAgYWJick0gPSBmb3JtYXQuaW5kZXhPZignYU0nKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJCID0gZm9ybWF0LmluZGV4T2YoJ2FCJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyVCA9IGZvcm1hdC5pbmRleE9mKCdhVCcpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickZvcmNlID0gYWJicksgfHwgYWJick0gfHwgYWJickIgfHwgYWJiclQ7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGEnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYScsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYScsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJzID49IE1hdGgucG93KDEwLCAxMikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyVCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDEyKSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDkpICYmICFhYmJyRm9yY2UgfHwgYWJickIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA5KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDYpICYmICFhYmJyRm9yY2UgfHwgYWJick0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFhYmJyRm9yY2UgfHwgYWJickspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIGFyZSBmb3JtYXR0aW5nIGJ5dGVzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2InKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGInKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGInLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2InLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLnBvdygxMDI0LCBwb3dlcik7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IE1hdGgucG93KDEwMjQsIHBvd2VyKzEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA+PSBtaW4gJiYgdmFsdWUgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMgKyBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWluID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIG9yZGluYWwgaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ28nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIG8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZCA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBvJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdvJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9yZCA9IG9yZCArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLm9yZGluYWwodmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ1suXScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcHREZWMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdbLl0nLCAnLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3ID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gZm9ybWF0LnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICB0aG91c2FuZHMgPSBmb3JtYXQuaW5kZXhPZignLCcpO1xuXG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWNpc2lvbi5pbmRleE9mKCdbJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24ucmVwbGFjZSgnXScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnNwbGl0KCdbJyk7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCAocHJlY2lzaW9uWzBdLmxlbmd0aCArIHByZWNpc2lvblsxXS5sZW5ndGgpLCByb3VuZGluZ0Z1bmN0aW9uLCBwcmVjaXNpb25bMV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLmxlbmd0aCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdyA9IGQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgICAgICAgICAgIGlmIChkLnNwbGl0KCcuJylbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgKyBkLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHREZWMgJiYgTnVtYmVyKGQuc2xpY2UoMSkpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHcgPSB0b0ZpeGVkKHZhbHVlLCBudWxsLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9ybWF0IG51bWJlclxuICAgICAgICAgICAgaWYgKHcuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICBuZWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhvdXNhbmRzID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy50b1N0cmluZygpLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrKD8hXFxkKSkvZywgJyQxJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMudGhvdXNhbmRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3ID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoKG5lZ1AgJiYgbmVnKSA/ICcoJyA6ICcnKSArICgoIW5lZ1AgJiYgbmVnKSA/ICctJyA6ICcnKSArICgoIW5lZyAmJiBzaWduZWQpID8gJysnIDogJycpICsgdyArIGQgKyAoKG9yZCkgPyBvcmQgOiAnJykgKyAoKGFiYnIpID8gYWJiciA6ICcnKSArICgoYnl0ZXMpID8gYnl0ZXMgOiAnJykgKyAoKG5lZ1AgJiYgbmVnKSA/ICcpJyA6ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIG51bWVyYWwgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgaWYgKG51bWVyYWwuaXNOdW1lcmFsKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC52YWx1ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0ID09PSAwIHx8IHR5cGVvZiBpbnB1dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICghTnVtYmVyKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBudW1lcmFsLmZuLnVuZm9ybWF0KGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJhbChOdW1iZXIoaW5wdXQpKTtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBudW1lcmFsLnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gY29tcGFyZSBudW1lcmFsIG9iamVjdFxuICAgIG51bWVyYWwuaXNOdW1lcmFsID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTnVtZXJhbDtcbiAgICB9O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbGFuZ3VhZ2VzIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxhbmd1YWdlIGtleS5cbiAgICBudW1lcmFsLmxhbmd1YWdlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudExhbmd1YWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtleSAmJiAhdmFsdWVzKSB7XG4gICAgICAgICAgICBpZighbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZXMgfHwgIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgfTtcbiAgICBcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgbG9hZGVkIGxhbmd1YWdlIGRhdGEuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnRcbiAgICAvLyBnbG9iYWwgbGFuZ3VhZ2Ugb2JqZWN0LlxuICAgIG51bWVyYWwubGFuZ3VhZ2VEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmxhbmd1YWdlKCdlbicsIHtcbiAgICAgICAgZGVsaW1pdGVyczoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiAnLCcsXG4gICAgICAgICAgICBkZWNpbWFsOiAnLidcbiAgICAgICAgfSxcbiAgICAgICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICAgICAgdGhvdXNhbmQ6ICdrJyxcbiAgICAgICAgICAgIG1pbGxpb246ICdtJyxcbiAgICAgICAgICAgIGJpbGxpb246ICdiJyxcbiAgICAgICAgICAgIHRyaWxsaW9uOiAndCdcbiAgICAgICAgfSxcbiAgICAgICAgb3JkaW5hbDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgICAgIHJldHVybiAofn4gKG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgIHN5bWJvbDogJyQnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG51bWVyYWwuemVyb0Zvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgemVyb0Zvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6IG51bGw7XG4gICAgfTtcblxuICAgIG51bWVyYWwuZGVmYXVsdEZvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6ICcwLjAnO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSB2YWx1ZXM7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGbG9hdGluZy1wb2ludCBoZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gVGhlIGZsb2F0aW5nLXBvaW50IGhlbHBlciBmdW5jdGlvbnMgYW5kIGltcGxlbWVudGF0aW9uXG4gICAgLy8gYm9ycm93cyBoZWF2aWx5IGZyb20gc2luZnVsLmpzOiBodHRwOi8vZ3VpcG4uZ2l0aHViLmlvL3NpbmZ1bC5qcy9cblxuICAgIC8qKlxuICAgICAqIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L1JlZHVjZSNDb21wYXRpYmlsaXR5XG4gICAgICovXG4gICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG51bGwgPT09IHRoaXMgfHwgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgLy8gQXQgdGhlIG1vbWVudCBhbGwgbW9kZXJuIGJyb3dzZXJzLCB0aGF0IHN1cHBvcnQgc3RyaWN0IG1vZGUsIGhhdmVcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZS4gRm9yIGluc3RhbmNlLCBJRThcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBzbyB0aGlzIGNoZWNrIGlzIGFjdHVhbGx5IHVzZWxlc3MuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLnJlZHVjZSBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoY2FsbGJhY2sgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMCxcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICgxIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpbmRleCA9IDA7IGxlbmd0aCA+IGluZGV4OyArK2luZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrKHZhbHVlLCB0aGlzW2luZGV4XSwgaW5kZXgsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBcbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgbXVsdGlwbGllciBuZWNlc3NhcnkgdG8gbWFrZSB4ID49IDEsXG4gICAgICogZWZmZWN0aXZlbHkgZWxpbWluYXRpbmcgbWlzY2FsY3VsYXRpb25zIGNhdXNlZCBieVxuICAgICAqIGZpbml0ZSBwcmVjaXNpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gbXVsdGlwbGllcih4KSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IHgudG9TdHJpbmcoKS5zcGxpdCgnLicpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDEwLCBwYXJ0c1sxXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgdmFyaWFibGUgbnVtYmVyIG9mIGFyZ3VtZW50cywgcmV0dXJucyB0aGUgbWF4aW11bVxuICAgICAqIG11bHRpcGxpZXIgdGhhdCBtdXN0IGJlIHVzZWQgdG8gbm9ybWFsaXplIGFuIG9wZXJhdGlvbiBpbnZvbHZpbmdcbiAgICAgKiBhbGwgb2YgdGhlbS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3JyZWN0aW9uRmFjdG9yKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBhcmdzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgbmV4dCkge1xuICAgICAgICAgICAgdmFyIG1wID0gbXVsdGlwbGllcihwcmV2KSxcbiAgICAgICAgICAgICAgICBtbiA9IG11bHRpcGxpZXIobmV4dCk7XG4gICAgICAgIHJldHVybiBtcCA+IG1uID8gbXAgOiBtbjtcbiAgICAgICAgfSwgLUluZmluaXR5KTtcbiAgICB9ICAgICAgICBcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBOdW1lcmFsIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgbnVtZXJhbC5mbiA9IE51bWVyYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWwodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtZXJhbCh0aGlzLCBcbiAgICAgICAgICAgICAgICAgIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0LCBcbiAgICAgICAgICAgICAgICAgIChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bmZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dFN0cmluZykgPT09ICdbb2JqZWN0IE51bWJlcl0nKSB7IFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFN0cmluZzsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5mb3JtYXROdW1lcmFsKHRoaXMsIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtICsgY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMCkgLyBjb3JyRmFjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gLSBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3ZhbHVlXS5yZWR1Y2UoY2JhY2ssIHRoaXMuX3ZhbHVlICogY29yckZhY3RvcikgLyBjb3JyRmFjdG9yOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbXVsdGlwbHkgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpICogKGN1cnIgKiBjb3JyRmFjdG9yKSAvXG4gICAgICAgICAgICAgICAgICAgIChjb3JyRmFjdG9yICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaXZpZGUgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpIC8gKGN1cnIgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrKTsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmZlcmVuY2UgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhudW1lcmFsKHRoaXMuX3ZhbHVlKS5zdWJ0cmFjdCh2YWx1ZSkudmFsdWUoKSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE51bWVyYWxcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBlbmRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gaGVyZSwgYHRoaXNgIG1lYW5zIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyXG4gICAgICAgIC8vIGFkZCBgbnVtZXJhbGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciAnYWR2YW5jZWQnIG1vZGVcbiAgICAgICAgdGhpc1snbnVtZXJhbCddID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBkZWZpbmU6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG4iLCIvKiBqc2hpbnQgbWF4Y29tcGxleGl0eToxNCAqL1xyXG4vKipcclxuICAgIEZvcm1hdCBleHRlbmRlciBmb3IgS25vY2tvdXQgb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBUaGUgZXh0ZW5kZXIgdHlwZXMgYXJlIGRlZmluZWQgZXh0ZXJuYWxseSBhbmQgcmVnaXN0ZXJlZFxyXG4gICAgaW4gJ3R5cGVzJyB3aXRoIGVhY2ggcHJvcGVydHkgdGhlIG5hbWUgb2YgdGhlIHR5cGUgYW5kIHRoZSB2YWx1ZVxyXG4gICAgdGhlIGZ1bmN0aW9uIGltcGxlbWVudGluZyBpdC5cclxuKiovXHJcbmV4cG9ydHMudHlwZXMgPSB7fTtcclxuXHJcbi8qKlxyXG4gICAgS25vY2tvdXQgZXh0ZW5kZXIsIHRvIGF0dGFjaCB0byBrby5leHRlbmRlcnMgd2l0aCB0aGUgZGVzaXJlZFxyXG4gICAgbmFtZSAoZm9yIGV4YW1wbGU6ICd0eXBlJyA6LSlcclxuKiovXHJcbmV4cG9ydHMuZm9ybWF0QmluZGluZyA9IHtcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3MpIHtcclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBrby51bndyYXAodmFsdWVBY2Nlc3NvcigpKSxcclxuICAgICAgICAgICAgdmFsdWUgPSBrby51bndyYXAoYWxsQmluZGluZ3MuZ2V0KCd0ZXh0JykpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBhcHBseUZvcm1hdCh2YWx1ZSwgZWxlbWVudCwgb3B0aW9ucywga28uZGF0YUZvcihlbGVtZW50KSk7XHJcblxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gYXBwbHlGb3JtYXQodmFsdWUsIGVsZW1lbnQsIG9wdGlvbnMsIGRhdGFDb250ZXh0KSB7XHJcblxyXG4gICAgdmFyIHR5cGUgPSBrby51bndyYXAob3B0aW9ucy50eXBlKTtcclxuXHJcbiAgICBpZiAodHlwZSAmJiB2YWx1ZSAmJiB0eXBlIGluIGV4cG9ydHMudHlwZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHR5cGVGb3JtYXR0ZXIgPSBleHBvcnRzLnR5cGVzW3R5cGVdO1xyXG4gICAgICAgIHZhciBzdHIgPSB0eXBlRm9ybWF0dGVyLmZvcm1hdCh2YWx1ZSwgb3B0aW9ucywga28uZGF0YUZvcihlbGVtZW50KSk7XHJcblxyXG4gICAgICAgIGlmICgnaHRtbCcgaW4gdHlwZUZvcm1hdHRlciAmJiB0eXBlRm9ybWF0dGVyLmh0bWwgPT09IHRydWUpXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkuaHRtbChzdHIpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJChlbGVtZW50KS50ZXh0KHN0cik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKiBEZWZpbml0aW9uIG9mIHNldmVyYWwgdHlwZXMgKi8gXHJcbmV4cG9ydHMudHlwZXMubGluayA9IHtcclxuICAgIGh0bWw6IHRydWUsXHJcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uIExpbmtGb3JtYXR0ZXIodmFsdWUsIGRlZiwgZGF0YUNvbnRleHQpIHtcclxuICAgIFxyXG4gICAgICAgIHZhciBsaW5rID0gZGVmID8gZGVmLmxpbmsgPyBkZWYubGluayA6IGRlZiA6IG51bGw7XHJcbiAgICAgICAgbGluayA9IHR5cGVvZihsaW5rKSA9PT0gJ3N0cmluZycgPyBsaW5rIDogbnVsbDtcclxuICAgICAgICB2YXIgciA9IHZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChsaW5rKSB7XHJcbiAgICAgICAgICAgIHIgPSAkKCc8YS8+Jyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBkZWYgPyBkZWYudGl0bGUgPyBkZWYudGl0bGUgOiBudWxsIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGRlZiA/IGRlZi50YXJnZXQgPyBkZWYudGFyZ2V0IDogbnVsbCA6IG51bGw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByLmF0dHIoJ2hyZWYnLCBsaW5rLnJlcGxhY2UoL19fdmFsdWVfXy9nLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICBpZiAodGl0bGUpXHJcbiAgICAgICAgICAgICAgICByLmF0dHIoJ3RpdGxlJywgdGl0bGUucmVwbGFjZSgvX192YWx1ZV9fL2csIHZhbHVlKSk7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXQpXHJcbiAgICAgICAgICAgICAgICByLmF0dHIoJ3RhcmdldCcsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETzogZGF0YUNvbnRleHQgcGxhY2Vob2xkZXJzXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoZGVmLmNvbnRlbnRGb3JtYXQpIHtcclxuICAgICAgICAgICAgICAgIGFwcGx5Rm9ybWF0KHZhbHVlLCByLCBkZWYuY29udGVudEZvcm1hdCwgZGF0YUNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgci50ZXh0KHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgciA9IHIub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuZXhwb3J0cy50eXBlcy5kYXRldGltZSA9IHtcclxuICAgIGZvcm1hdDogZnVuY3Rpb24gRGF0ZVRpbWVGb3JtYXR0ZXIodmFsdWUsIGRlZiwgZGF0YUNvbnRleHQpIHtcclxuICAgICAgICB2YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCF2YWx1ZSlcclxuICAgICAgICAgICAgcmV0dXJuIGRlZi5kZWZhdWx0IHx8IGRlZi5pbnZhbGlkIHx8ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkdCA9IG1vbWVudCh2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIGR0LmlzVmFsaWQoKSA/IGR0LmZvcm1hdChkZWYuZm9ybWF0KSA6IGRlZi5pbnZhbGlkIHx8ICcnO1xyXG4gICAgfVxyXG59O1xyXG4gICAgXHJcbmV4cG9ydHMudHlwZXMuY29uY2F0ID0ge1xyXG4gICAgZm9ybWF0OiBmdW5jdGlvbiBDb25jYXRGb3JtYXR0ZXIodmFsdWUsIGRlZiwgZGF0YUNvbnRleHQpIHtcclxuXHJcbiAgICAgICAgdmFyIGZpZWxkcyA9ICQubWFwKGRlZi5mb3JtYXQsIGZ1bmN0aW9uKHYsIGkpIHtcclxuICAgICAgICAgICAgLy8gSWYgaXMgbm90IGEgbGl0ZXJhbCAoYmV0d2VlbiBjb21pbGVzKSwgaXMgYSBmaWVsZFxyXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRoZSB2YWx1ZSBmcm9tIHRoZSBzb3VyY2UgYW5kIHB1dCBpdCBpbiB0aGUgbGlzdFxyXG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSAvW1wiJ10oLiopW1wiJ10vLmV4ZWModik7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCAmJiBtYXRjaC5sZW5ndGggPiAxKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YUNvbnRleHRbdl07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmaWVsZHMuam9pbignJyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgbnVtZXJhbCA9IHJlcXVpcmUoJ251bWVyYWwnKTsgICAgXHJcbmV4cG9ydHMudHlwZXMubnVtYmVyID0ge1xyXG4gICAgZm9ybWF0OiBmdW5jdGlvbiBOdW1iZXJGb3JtYXR0ZXIodmFsdWUsIGRlZiwgZGF0YUNvbnRleHQpIHtcclxuICAgICAgICB2YXIgbnVtZXJhbCA9IHJlcXVpcmUoJ251bWVyYWwnKTtcclxuICAgICAgICByZXR1cm4gbnVtZXJhbCh2YWx1ZSkuZm9ybWF0KGRlZi5mb3JtYXQpO1xyXG4gICAgfVxyXG59O1xyXG4gICAgXHJcbmV4cG9ydHMudHlwZXMuYm9vbCA9IHtcclxuICAgIGZvcm1hdDogZnVuY3Rpb24gQm9vbEZvcm1hdHRlcih2YWx1ZSwgZGVmLCBkYXRhQ29udGV4dCkge1xyXG4gICAgICAgIHZhciB2cyA9IGRlZi52YWx1ZXM7XHJcbiAgICAgICAgaWYgKCF2cyB8fCB2cy5sZW5ndGggIT09IDIpXHJcbiAgICAgICAgICAgIHZzID0gWyd0cnVlJywgJ2ZhbHNlJ107XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZSA/IHZzWzBdIDogdnNbMV07XHJcbiAgICB9XHJcbn07XHJcbiJdfQ==
;