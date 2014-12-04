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
    this.$datepicker
    .on('swipeleft', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveDate', 'next');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        this.$datepicker.datepicker('moveDate', 'prev');
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
    ko = require('knockout');
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
    
    var viewData = new ViewModel();
    viewData.headerText = 'Select a start time';
    ko.applyBindings(viewData, $activity.get(0));
    
    // Events
    this.$datePicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            viewData.selectedDate(e.date);
        }
    }.bind(this));
    
    // TESTING data
    viewData.slots.push(Time(9, 15));
    viewData.slots.push(Time(11, 30));
    viewData.slots.push(Time(12, 0));
    viewData.slots.push(Time(12, 30));
    viewData.slots.push(Time(16, 15));
    viewData.slots.push(Time(18, 0));
    viewData.slots.push(Time(18, 30));
    viewData.slots.push(Time(19, 0));
    viewData.slots.push(Time(19, 30));
    viewData.slots.push(Time(21, 30));
    viewData.slots.push(Time(22, 0));
}

function ViewModel() {

    this.headerText = ko.observable('Select a time');
    this.selectedDate = ko.observable(new Date());
    this.slots = ko.observableArray([]);

}

function Time(hour, minute, second) {
    var current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), current.getDate(), hour || 0, minute || 0, second || 0);
}

},{"../components/DatePicker":4,"knockout":false,"moment":false}],3:[function(require,module,exports){
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

},{"../vendor/iagosrl/ko/formatBinding":12,"./activities/calendar":1,"./activities/datetimePicker":2,"knockout":false}],4:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"knockout":false,"moment":false,"numeral":11}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9kYXRldGltZVBpY2tlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL2pzL21vZGVscy9BcHBvaW50bWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL0NhbGVuZGFyU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL0NsaWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvdGVzdGRhdGEvY2FsZW5kYXJTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvdmVuZG9yL2lhZ29zcmwva28vZm9ybWF0QmluZGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNob0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBDYWxlbmRhciBhY3Rpdml0eSAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDYWxlbmRhcigkYWN0aXZpdHkpIHtcclxuICAgIHZhciBjYWxlbmRhciA9IG5ldyBDYWxlbmRhckFjdGl2aXR5KCRhY3Rpdml0eSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhckFjdGl2aXR5KCRhY3Rpdml0eSkge1xyXG5cclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlciA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiRkYWlseVZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGFpbHlWaWV3Jyk7XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVIZWFkZXInKTtcclxuICAgIHRoaXMuJGRhdGVUaXRsZSA9IHRoaXMuJGRhdGVIZWFkZXIuY2hpbGRyZW4oJy5DYWxlbmRhckRhdGVIZWFkZXItZGF0ZScpO1xyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckNob29zZU5ldycpO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICAvKiBFdmVudCBoYW5kbGVycyAqL1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlclxyXG4gICAgLm9uKCdzd2lwZWxlZnQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZURhdGUnLCAnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ21vdmVEYXRlJywgJ3ByZXYnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy4kZGFpbHlWaWV3XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICB9LmJpbmQodGhpcykpXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ3ByZXYnLCAnZGF0ZScpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgdGhpcy4kZGF0ZUhlYWRlci5vbigndGFwJywgJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHN3aXRjaCAoZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJyNwcmV2JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ3ByZXYnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJyNuZXh0JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ25leHQnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBMZXRzIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLiRkYXRlVGl0bGUub24oJ3RhcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnRvZ2dsZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAkYWN0aXZpdHkub24oJ3RhcCcsICdbZGF0YS10b2dnbGU9XCJhY3Rpdml0eVwiXVtkYXRhLXRhcmdldD1cImNhbGVuZGFyLWFwcG9pbnRtZW50XCJdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMuJGNob29zZU5ldy5tb2RhbCgnaGlkZScpO1xyXG4gICAgICAgIHRoaXMuc2hvd0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLyogVmlzdWFsaXphdGlvbiAqL1xyXG4gICAgLy8gU3RhcnQgd2l0aCBkYWlseSB2aWV3IGFuZCBpbml0aWFsIGRhdGU6XHJcbiAgICB0aGlzLnNob3dEYWlseVZpZXcodGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdnZXRWYWx1ZScpLCB0cnVlKTtcclxufTtcclxuXHJcbkNhbGVuZGFyQWN0aXZpdHkucHJvdG90eXBlLnVwZGF0ZURhdGVUaXRsZSA9IGZ1bmN0aW9uIHVwZGF0ZURhdGVUaXRsZShkYXRlKSB7XHJcbiAgICBkYXRlID0gbW9tZW50KGRhdGUpO1xyXG4gICAgdmFyIGRhdGVJbmZvID0gdGhpcy4kZGF0ZVRpdGxlLmNoaWxkcmVuKCd0aW1lOmVxKDApJyk7XHJcbiAgICBkYXRlSW5mby5hdHRyKCdkYXRldGltZScsIGRhdGUudG9JU09TdHJpbmcoKSk7XHJcbiAgICBkYXRlSW5mby50ZXh0KGRhdGUuZm9ybWF0KCdkZGRkIChNL0QpJykpO1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG59O1xyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuYmluZERhdGVEYXRhID0gZnVuY3Rpb24gYmluZERhdGVEYXRhKGRhdGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMuZGFpbHlEYXRhVmlldy5zbG90c0RhdGE7XHJcbiAgICBcclxuICAgIGlmIChzbG90c0RhdGEuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgdGhpcy5kYWlseURhdGFWaWV3LnNsb3RzKHNsb3RzRGF0YVtzZGF0ZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhaWx5RGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbkNhbGVuZGFyQWN0aXZpdHkucHJvdG90eXBlLnNob3dEYWlseVZpZXcgPSBmdW5jdGlvbiBzaG93RGFpbHlWaWV3KGRhdGUsIGZpcnN0UnVuKSB7XHJcblxyXG4gICAgaWYgKGZpcnN0UnVuIHx8ICF0aGlzLiRkYWlseVZpZXcuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcuaGlkZSgpO1xyXG4gICAgICAgIHRoaXMuJGRhaWx5Vmlldy5zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9faW5pdGVkRGFpbHlWaWV3KSB7XHJcbiAgICAgICAgdGhpcy5fX2luaXRlZERhaWx5VmlldyA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRGF0YVxyXG4gICAgICAgIHZhciBzbG90c0RhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhclNsb3RzJykuY2FsZW5kYXI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5kYWlseURhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBzbG90czoga28ub2JzZXJ2YWJsZUFycmF5KFtdKSxcclxuICAgICAgICAgICAgc2xvdHNEYXRhOiBzbG90c0RhdGFcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYWlseURhdGFWaWV3LCB0aGlzLiRkYWlseVZpZXcuZ2V0KDApKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBFdmVudHNcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLm9uKCdjaGFuZ2VEYXRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dEYWlseVZpZXcoZS5kYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy4kZGFpbHlWaWV3Lm9uKCd0YXAnLCAnLkxpc3RWaWV3LWl0ZW0gYScsIGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBsaW5rID0gZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgICAgICAgICBpZiAoL14jY2FsZW5kYXJcXC9hcHBvaW50bWVudC9pLnRlc3QobGluaykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGNob29zZU5ldy5tb2RhbCgnaGlkZScpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICgvXiNjYWxlbmRhclxcL25ldy9pLnRlc3QobGluaykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGNob29zZU5ldy5tb2RhbCgnc2hvdycpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gT3B0aW9uYWwgZGF0ZSwgb3IgbWFpbnRhaW4gY3VycmVudCBvbmVcclxuICAgIGlmIChkYXRlICYmIGRhdGUgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVEYXRlVGl0bGUoZGF0ZSk7XHJcbiAgICAgICAgdGhpcy5iaW5kRGF0ZURhdGEoZGF0ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5DYWxlbmRhckFjdGl2aXR5LnByb3RvdHlwZS5zaG93QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBzaG93QXBwb2ludG1lbnQoKSB7XHJcbiAgICBcclxuICAgIC8vIFZpc3VhbGl6YXRpb246XHJcbiAgICB0aGlzLiRkYWlseVZpZXcuaGlkZSgpO1xyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3LnNob3coKTtcclxuICAgIFxyXG4gICAgaWYgKCF0aGlzLl9faW5pdGVkQXBwb2ludG1lbnQpIHtcclxuICAgICAgICB0aGlzLl9faW5pdGVkQXBwb2ludG1lbnQgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHRlc3REYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHM7XHJcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50c0RhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBhcHBvaW50bWVudHM6IGtvLm9ic2VydmFibGVBcnJheSh0ZXN0RGF0YSksXHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDoga28ub2JzZXJ2YWJsZSgwKSxcclxuICAgICAgICAgICAgZWRpdE1vZGU6IGtvLm9ic2VydmFibGUoZmFsc2UpLFxyXG4gICAgICAgICAgICBpc05ldzoga28ub2JzZXJ2YWJsZShmYWxzZSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBvaW50bWVudHMoKVt0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGhdO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmdvUHJldmlvdXMgPSBmdW5jdGlvbiBnb1ByZXZpb3VzKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCgpID09PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgodGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgoKHRoaXMuY3VycmVudEluZGV4KCkgLSAxKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmdvTmV4dCA9IGZ1bmN0aW9uIGdvTmV4dCgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdE1vZGUoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgoKHRoaXMuY3VycmVudEluZGV4KCkgKyAxKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0ID0gZnVuY3Rpb24gZWRpdCgpIHtcclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3MoYXBwb2ludG1lbnRzRGF0YVZpZXcsIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5nZXQoMCkpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIGRhdGV0aW1lUGlja2VyIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdERhdGV0aW1lUGlja2VyKCRhY3Rpdml0eSkge1xyXG4gICAgdmFyIGNhbGVuZGFyID0gbmV3IERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG5cclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB2YXIgdmlld0RhdGEgPSBuZXcgVmlld01vZGVsKCk7XHJcbiAgICB2aWV3RGF0YS5oZWFkZXJUZXh0ID0gJ1NlbGVjdCBhIHN0YXJ0IHRpbWUnO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh2aWV3RGF0YSwgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICBcclxuICAgIC8vIEV2ZW50c1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5vbignY2hhbmdlRGF0ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgIHZpZXdEYXRhLnNlbGVjdGVkRGF0ZShlLmRhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIFRFU1RJTkcgZGF0YVxyXG4gICAgdmlld0RhdGEuc2xvdHMucHVzaChUaW1lKDksIDE1KSk7XHJcbiAgICB2aWV3RGF0YS5zbG90cy5wdXNoKFRpbWUoMTEsIDMwKSk7XHJcbiAgICB2aWV3RGF0YS5zbG90cy5wdXNoKFRpbWUoMTIsIDApKTtcclxuICAgIHZpZXdEYXRhLnNsb3RzLnB1c2goVGltZSgxMiwgMzApKTtcclxuICAgIHZpZXdEYXRhLnNsb3RzLnB1c2goVGltZSgxNiwgMTUpKTtcclxuICAgIHZpZXdEYXRhLnNsb3RzLnB1c2goVGltZSgxOCwgMCkpO1xyXG4gICAgdmlld0RhdGEuc2xvdHMucHVzaChUaW1lKDE4LCAzMCkpO1xyXG4gICAgdmlld0RhdGEuc2xvdHMucHVzaChUaW1lKDE5LCAwKSk7XHJcbiAgICB2aWV3RGF0YS5zbG90cy5wdXNoKFRpbWUoMTksIDMwKSk7XHJcbiAgICB2aWV3RGF0YS5zbG90cy5wdXNoKFRpbWUoMjEsIDMwKSk7XHJcbiAgICB2aWV3RGF0YS5zbG90cy5wdXNoKFRpbWUoMjIsIDApKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gVGltZShob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgcmV0dXJuIG5ldyBEYXRlKGN1cnJlbnQuZ2V0RnVsbFllYXIoKSwgY3VycmVudC5nZXRNb250aCgpLCBjdXJyZW50LmdldERhdGUoKSwgaG91ciB8fCAwLCBtaW51dGUgfHwgMCwgc2Vjb25kIHx8IDApO1xyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBHbG9iYWwgZGVwZW5kZW5jaWVzICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktbW9iaWxlJyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLmJpbmRpbmdIYW5kbGVycy5mb3JtYXQgPSByZXF1aXJlKCcuLi92ZW5kb3IvaWFnb3NybC9rby9mb3JtYXRCaW5kaW5nJykuZm9ybWF0QmluZGluZztcclxuXHJcbi8qKiBMb2FkIGFjdGl2aXRpZXMgKiovXHJcbnZhciBhY3Rpdml0aWVzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJyksXHJcbiAgICAnZGF0ZXRpbWVQaWNrZXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXInKVxyXG59O1xyXG5cclxuLyoqIFBhZ2UgcmVhZHkgKiovXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBEZXRlY3QgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIGN1cnJlbnQgZG9jdW1lbnRcclxuICAgIC8vIGFuZCBpbml0aWFsaXplIHRoZW06XHJcbiAgICAkKCdbZGF0YS1hY3Rpdml0eV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkYWN0aXZpdHkgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdGl2aXR5LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgaWYgKGFjdGl2aXRpZXMuaGFzT3duUHJvcGVydHkoYWN0TmFtZSkpIHtcclxuICAgICAgICAgICAgYWN0aXZpdGllc1thY3ROYW1lXS5pbml0KCRhY3Rpdml0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogRGF0ZVBpY2tlciBKUyBDb21wb25lbnQsIHdpdGggc2V2ZXJhbFxyXG4gKiBtb2RlcyBhbmQgb3B0aW9uYWwgaW5saW5lLXBlcm1hbmVudCB2aXN1YWxpemF0aW9uLlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgMjAxNCBMb2Nvbm9taWNzIENvb3AuXHJcbiAqXHJcbiAqIEJhc2VkIG9uOlxyXG4gKiBib290c3RyYXAtZGF0ZXBpY2tlci5qcyBcclxuICogaHR0cDovL3d3dy5leWVjb24ucm8vYm9vdHN0cmFwLWRhdGVwaWNrZXJcclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIENvcHlyaWdodCAyMDEyIFN0ZWZhbiBQZXRyZVxyXG4gKlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7IFxyXG5cclxudmFyIGNsYXNzZXMgPSB7XHJcbiAgICBjb21wb25lbnQ6ICdEYXRlUGlja2VyJyxcclxuICAgIG1vbnRoczogJ0RhdGVQaWNrZXItbW9udGhzJyxcclxuICAgIGRheXM6ICdEYXRlUGlja2VyLWRheXMnLFxyXG4gICAgbW9udGhEYXk6ICdkYXknLFxyXG4gICAgbW9udGg6ICdtb250aCcsXHJcbiAgICB5ZWFyOiAneWVhcicsXHJcbiAgICB5ZWFyczogJ0RhdGVQaWNrZXIteWVhcnMnXHJcbn07XHJcblxyXG4vLyBQaWNrZXIgb2JqZWN0XHJcbnZhciBEYXRlUGlja2VyID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czozMixtYXhjb21wbGV4aXR5OjI0Ki9cclxuICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCk7XHJcbiAgICB0aGlzLmZvcm1hdCA9IERQR2xvYmFsLnBhcnNlRm9ybWF0KG9wdGlvbnMuZm9ybWF0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1mb3JtYXQnKXx8J21tL2RkL3l5eXknKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0lucHV0ID0gdGhpcy5lbGVtZW50LmlzKCdpbnB1dCcpO1xyXG4gICAgdGhpcy5jb21wb25lbnQgPSB0aGlzLmVsZW1lbnQuaXMoJy5kYXRlJykgPyB0aGlzLmVsZW1lbnQuZmluZCgnLmFkZC1vbicpIDogZmFsc2U7XHJcbiAgICB0aGlzLmlzUGxhY2Vob2xkZXIgPSB0aGlzLmVsZW1lbnQuaXMoJy5jYWxlbmRhci1wbGFjZWhvbGRlcicpO1xyXG4gICAgXHJcbiAgICB0aGlzLnBpY2tlciA9ICQoRFBHbG9iYWwudGVtcGxhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLmlzUGxhY2Vob2xkZXIgPyB0aGlzLmVsZW1lbnQgOiAnYm9keScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLmNsaWNrLCB0aGlzKSk7XHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5taW5WaWV3TW9kZSA9IG9wdGlvbnMubWluVmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLW1pbnZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWluVmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm1pblZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnZpZXdNb2RlID0gb3B0aW9ucy52aWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtdmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy52aWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMudmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XHJcbiAgICB0aGlzLndlZWtTdGFydCA9IG9wdGlvbnMud2Vla1N0YXJ0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKXx8MDtcclxuICAgIHRoaXMud2Vla0VuZCA9IHRoaXMud2Vla1N0YXJ0ID09PSAwID8gNiA6IHRoaXMud2Vla1N0YXJ0IC0gMTtcclxuICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyO1xyXG4gICAgdGhpcy5maWxsRG93KCk7XHJcbiAgICB0aGlzLmZpbGxNb250aHMoKTtcclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB0aGlzLnNob3dNb2RlKCk7XHJcbn07XHJcblxyXG5EYXRlUGlja2VyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBEYXRlUGlja2VyLFxyXG4gICAgXHJcbiAgICBzaG93OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCgpIDogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgdGhpcy5wbGFjZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XHJcbiAgICAgICAgaWYgKGUgKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldil7XHJcbiAgICAgICAgICAgIGlmICgkKGV2LnRhcmdldCkuY2xvc2VzdCgnLicgKyBjbGFzc2VzLmNvbXBvbmVudCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHRoaXMucGxhY2UpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XHJcbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZvcm1hdGVkID0gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKiBBcHBvaW50bWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByaWNpbmc6IHt9LCAvLyBUT0RPIGZ1dHVyZSBQcmljaW5nIG1vZGVsXHJcbiAgICAgICAgcHJpY2luZ1N1bW1hcnk6ICcnLCAvLyBUT0RPIEZ1dHVyZSBjb21wdXRlZCBmcm9tIHByaWNpbmcgZmllbGRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9jYXRpb246IHt9LCAvLyBUT0RPIGZ1dHVyZSBMb2NhdGlvbiBtb2RlbFxyXG4gICAgICAgIGxvY2F0aW9uU3VtbWFyeTogJycsIC8vIFRPRE8gRnV0dXJlIGNvbXB1dGVkIGZyb20gbG9jYXRpb24gZmllbGRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgbm90ZXNUb1NlbGY6ICcnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuY2xpZW50ID0ga28ub2JzZXJ2YWJsZShuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBvaW50bWVudDtcclxuIiwiLyoqIENhbGVuZGFyU2xvdCBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSB0aW1lIHNsb3QgaW4gdGhlIGNhbGVuZGFyLCBmb3IgYSBjb25zZWN1dGl2ZVxyXG4gICAgZXZlbnQsIGFwcG9pbnRtZW50IG9yIGZyZWUgdGltZS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJTbG90KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclNsb3Q7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJydcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5maXJzdE5hbWUoKSArICcgJyArIHRoaXMubGFzdE5hbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDbGllbnQ7XHJcbiIsIi8qKlxyXG4gICAgTW9kZWwgY2xhc3MgdG8gaGVscCBidWlsZCBtb2RlbHMuXHJcblxyXG4gICAgSXMgbm90IGV4YWN0bHkgYW4gJ09PUCBiYXNlJyBjbGFzcywgYnV0IHByb3ZpZGVzXHJcbiAgICB1dGlsaXRpZXMgdG8gbW9kZWxzIGFuZCBhIG1vZGVsIGRlZmluaXRpb24gb2JqZWN0XHJcbiAgICB3aGVuIGV4ZWN1dGVkIGluIHRoZWlyIGNvbnN0cnVjdG9ycyBhczpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICBmdW5jdGlvbiBNeU1vZGVsKCkge1xyXG4gICAgICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgICAgIC8vIE5vdywgdGhlcmUgaXMgYSB0aGlzLm1vZGVsIHByb3BlcnR5IHdpdGhcclxuICAgICAgICAvLyBhbiBpbnN0YW5jZSBvZiB0aGUgTW9kZWwgY2xhc3MsIHdpdGggXHJcbiAgICAgICAgLy8gdXRpbGl0aWVzIGFuZCBtb2RlbCBzZXR0aW5ncy5cclxuICAgIH1cclxuICAgICcnJ1xyXG4gICAgXHJcbiAgICBUaGF0IGF1dG8gY3JlYXRpb24gb2YgJ21vZGVsJyBwcm9wZXJ0eSBjYW4gYmUgYXZvaWRlZFxyXG4gICAgd2hlbiB1c2luZyB0aGUgb2JqZWN0IGluc3RhbnRpYXRpb24gc3ludGF4ICgnbmV3JyBrZXl3b3JkKTpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwob2JqKTtcclxuICAgIC8vIFRoZXJlIGlzIG5vIGEgJ29iai5tb2RlbCcgcHJvcGVydHksIGNhbiBiZVxyXG4gICAgLy8gYXNzaWduZWQgdG8gd2hhdGV2ZXIgcHJvcGVydHkgb3Igbm90aGluZy5cclxuICAgICcnJ1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZnVuY3Rpb24gTW9kZWwobW9kZWxPYmplY3QpIHtcclxuICAgIFxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVsKSkge1xyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGFzIGEgZnVuY3Rpb24sIGl0IG11c3QgY3JlYXRlXHJcbiAgICAgICAgLy8gYSBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChtb2RlbE9iamVjdCk7XHJcbiAgICAgICAgLy8gYW5kIHJlZ2lzdGVyIGF1dG9tYXRpY2FsbHkgYXMgcGFydFxyXG4gICAgICAgIC8vIG9mIHRoZSBtb2RlbE9iamVjdCBpbiAnbW9kZWwnIHByb3BlcnR5XHJcbiAgICAgICAgbW9kZWxPYmplY3QubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgIHJldHVybiBtb2RlbDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbE9iamVjdCA9IG1vZGVsT2JqZWN0O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgb2JzZXJ2YWJsZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBnaXZlblxyXG4gICAgcHJvcGVydGllcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcyAobm9ybWFsbHkgdGhhdCBpcyBwcm92aWRlZCBleHRlcm5hbGx5XHJcbiAgICBhcyBhIHBhcmFtZXRlciB0byB0aGUgbW9kZWwgY29uc3RydWN0b3IsIHdoaWxlIGRlZmF1bHQgdmFsdWVzIGFyZVxyXG4gICAgc2V0IGluIHRoZSBjb25zdHJ1Y3RvcikuXHJcbiAgICBUaGF0IHByb3BlcnRpZXMgYmVjb21lIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0LCBzaW1wbGlmeWluZyBcclxuICAgIG1vZGVsIGRlZmluaXRpb25zLlxyXG4gICAgXHJcbiAgICBJdCB1c2VzIEtub2Nrb3V0Lm9ic2VydmFibGUgYW5kIG9ic2VydmFibGVBcnJheSwgc28gcHJvcGVydGllc1xyXG4gICAgYXJlIGZ1bnRpb25zIHRoYXQgcmVhZHMgdGhlIHZhbHVlIHdoZW4gbm8gYXJndW1lbnRzIG9yIHNldHMgd2hlblxyXG4gICAgb25lIGFyZ3VtZW50IGlzIHBhc3NlZCBvZi5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmUHJvcGVydGllcyhwcm9wZXJ0aWVzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdDtcclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0oaW5pdGlhbFZhbHVlc1trZXldKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3Q7XHJcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5lYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWZWYWwgPSBwcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBkZWZWYWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgIH0pOyAgICBcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIEFwcG9pbnRtZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEyLCAwLCAwKSxcclxuICAgICAgICBwcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb25TdW1tYXJ5OiAnMzE1MCAxOHRoIFN0cmVldCBTYW4gRnJhbmNpc2NvLCBDQScsXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJ0xvb2tpbmcgZm9yd2FyZCB0byBzZWVpbmcgdGhlIG5ldyBjb2xvcicsXHJcbiAgICAgICAgbm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IGhpcyBuZXcgY29sb3InLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgNTAsIDApLFxyXG4gICAgICAgIHByaWNpbmdTdW1tYXJ5OiAnQW5vdGhlciBNYXNzYWdlIDUwbScsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb25TdW1tYXJ5OiAnMzE1MCAxOHRoIFN0cmVldCBTYW4gRnJhbmNpc2NvLCBDQScsXHJcbiAgICAgICAgbm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBub3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvblN1bW1hcnk6ICczMTUwIDE4dGggU3RyZWV0IFNhbiBGcmFuY2lzY28sIENBJyxcclxuICAgICAgICBub3Rlc1RvQ2xpZW50OiAnJyxcclxuICAgICAgICBub3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgdGhlIGZvcmdvdHRlbiBub3RlcycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG5dO1xyXG5cclxuZXhwb3J0cy5hcHBvaW50bWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIENhbGVuZGFyIFNsb3RzIHRlc3QgZGF0YSAqKi9cclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTIsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNSwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB0aGF0IGltcG9ydGFudCB0aGluZycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9ldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2FwcG9pbnRtZW50LzUnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckMTU5LjkwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgOSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCA5LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxMSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDEyLCA0NSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0NPTkZJUk0tU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxNywgMTUsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9hcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxNywgMTUsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAyLCAxOCwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdEZW50aXN0IGFwcG9pbnRtZW50JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2V2ZW50LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1uZXctd2luZG93JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDE4LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDIsIDE5LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyNjYWxlbmRhci9hcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMTksIDMwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMjMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL25ldycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMiwgMjMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAzLCAwLCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0phcmVuIEZyZWVseScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnI2NhbGVuZGFyL2FwcG9pbnRtZW50LzYnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckODAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGFGcmVlID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAwLCAxLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAwLCAyLCAwLCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICcyMDE0LTEyLTAxJzogdGVzdERhdGExLFxyXG4gICAgJzIwMTQtMTItMDInOiB0ZXN0RGF0YTIsXHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhRnJlZVxyXG59O1xyXG5cclxuZXhwb3J0cy5jYWxlbmRhciA9IHRlc3REYXRhO1xyXG4iLCIvKiFcbiAqIG51bWVyYWwuanNcbiAqIHZlcnNpb24gOiAxLjUuM1xuICogYXV0aG9yIDogQWRhbSBEcmFwZXJcbiAqIGxpY2Vuc2UgOiBNSVRcbiAqIGh0dHA6Ly9hZGFtd2RyYXBlci5naXRodWIuY29tL051bWVyYWwtanMvXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG51bWVyYWwsXG4gICAgICAgIFZFUlNJT04gPSAnMS41LjMnLFxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXG4gICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9ICdlbicsXG4gICAgICAgIHplcm9Gb3JtYXQgPSBudWxsLFxuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gJzAsMCcsXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIE51bWVyYWwgcHJvdG90eXBlIG9iamVjdFxuICAgIGZ1bmN0aW9uIE51bWVyYWwgKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuICAgICAqXG4gICAgICogRml4ZXMgYmluYXJ5IHJvdW5kaW5nIGlzc3VlcyAoZWcuICgwLjYxNSkudG9GaXhlZCgyKSA9PT0gJzAuNjEnKSB0aGF0IHByZXNlbnRcbiAgICAgKiBwcm9ibGVtcyBmb3IgYWNjb3VudGluZy0gYW5kIGZpbmFuY2UtcmVsYXRlZCBzb2Z0d2FyZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0ZpeGVkICh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uLCBvcHRpb25hbHMpIHtcbiAgICAgICAgdmFyIHBvd2VyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbiksXG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAsXG4gICAgICAgICAgICBvdXRwdXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9yb3VuZGluZ0Z1bmN0aW9uID0gKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kKTtcbiAgICAgICAgLy8gTXVsdGlwbHkgdXAgYnkgcHJlY2lzaW9uLCByb3VuZCBhY2N1cmF0ZWx5LCB0aGVuIGRpdmlkZSBhbmQgdXNlIG5hdGl2ZSB0b0ZpeGVkKCk6XG4gICAgICAgIG91dHB1dCA9IChyb3VuZGluZ0Z1bmN0aW9uKHZhbHVlICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxzKSB7XG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAgPSBuZXcgUmVnRXhwKCcwezEsJyArIG9wdGlvbmFscyArICd9JCcpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2Uob3B0aW9uYWxzUmVnRXhwLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRm9ybWF0dGluZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIGRldGVybWluZSB3aGF0IHR5cGUgb2YgZm9ybWF0dGluZyB3ZSBuZWVkIHRvIGRvXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtZXJhbCAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBvdXRwdXQ7XG5cbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGF0IGtpbmQgb2YgZm9ybWF0IHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCckJykgPiAtMSkgeyAvLyBjdXJyZW5jeSEhISEhXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRDdXJyZW5jeShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCclJykgPiAtMSkgeyAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRQZXJjZW50YWdlKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJzonKSA+IC0xKSB7IC8vIHRpbWVcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFRpbWUobiwgZm9ybWF0KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGxhaW4gb2wnIG51bWJlcnMgb3IgYnl0ZXNcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldHVybiBzdHJpbmdcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdG8gbnVtYmVyXG4gICAgZnVuY3Rpb24gdW5mb3JtYXROdW1lcmFsIChuLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHN0cmluZ09yaWdpbmFsID0gc3RyaW5nLFxuICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAsXG4gICAgICAgICAgICBtaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSBmYWxzZSxcbiAgICAgICAgICAgIHBvd2VyO1xuXG4gICAgICAgIGlmIChzdHJpbmcuaW5kZXhPZignOicpID4gLTEpIHtcbiAgICAgICAgICAgIG4uX3ZhbHVlID0gdW5mb3JtYXRUaW1lKHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICE9PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcLi9nLCcnKS5yZXBsYWNlKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCwgJy4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9ucyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZCArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIGJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBieXRlcyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSAoc3RyaW5nLmluZGV4T2Yoc3VmZml4ZXNbcG93ZXJdKSA+IC0xKSA/IE1hdGgucG93KDEwMjQsIHBvd2VyICsgMSkgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXNNdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWUgbWF0aCB0byBjcmVhdGUgb3VyIG51bWJlclxuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKChieXRlc011bHRpcGxpZXIpID8gYnl0ZXNNdWx0aXBsaWVyIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRob3VzYW5kUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMykgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2gobWlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDYpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKGJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA5KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0cmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDEyKSA6IDEpICogKChzdHJpbmcuaW5kZXhPZignJScpID4gLTEpID8gMC4wMSA6IDEpICogKCgoc3RyaW5nLnNwbGl0KCctJykubGVuZ3RoICsgTWF0aC5taW4oc3RyaW5nLnNwbGl0KCcoJykubGVuZ3RoLTEsIHN0cmluZy5zcGxpdCgnKScpLmxlbmd0aC0xKSkgJSAyKT8gMTogLTEpICogTnVtYmVyKHN0cmluZy5yZXBsYWNlKC9bXjAtOVxcLl0rL2csICcnKSk7XG5cbiAgICAgICAgICAgICAgICAvLyByb3VuZCBpZiB3ZSBhcmUgdGFsa2luZyBhYm91dCBieXRlc1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKGJ5dGVzTXVsdGlwbGllcikgPyBNYXRoLmNlaWwobi5fdmFsdWUpIDogbi5fdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG4uX3ZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5IChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHN5bWJvbEluZGV4ID0gZm9ybWF0LmluZGV4T2YoJyQnKSxcbiAgICAgICAgICAgIG9wZW5QYXJlbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJygnKSxcbiAgICAgICAgICAgIG1pbnVzU2lnbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJy0nKSxcbiAgICAgICAgICAgIHNwYWNlID0gJycsXG4gICAgICAgICAgICBzcGxpY2VJbmRleCxcbiAgICAgICAgICAgIG91dHB1dDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIG9yIGFmdGVyIGN1cnJlbmN5XG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICQnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJCcsICcnKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJCAnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckICcsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXJcbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIHBvc2l0aW9uIHRoZSBzeW1ib2xcbiAgICAgICAgaWYgKHN5bWJvbEluZGV4IDw9IDEpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKCcpID4gLTEgfHwgb3V0cHV0LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbEluZGV4IDwgb3BlblBhcmVuSW5kZXggfHwgc3ltYm9sSW5kZXggPCBtaW51c1NpZ25JbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzeW1ib2wgYXBwZWFycyBiZWZvcmUgdGhlIFwiKFwiIG9yIFwiLVwiXG4gICAgICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZShzcGxpY2VJbmRleCwgMCwgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgdmFsdWUgPSBuLl92YWx1ZSAqIDEwMDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlICVcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJScpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAlJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyUnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xICkge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgJyUnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgJyUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRUaW1lIChuKSB7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3Iobi5fdmFsdWUvNjAvNjApLFxuICAgICAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3IoKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpLzYwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgICAgIHJldHVybiBob3VycyArICc6JyArICgobWludXRlcyA8IDEwKSA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArICgoc2Vjb25kcyA8IDEwKSA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmZvcm1hdFRpbWUgKHN0cmluZykge1xuICAgICAgICB2YXIgdGltZUFycmF5ID0gc3RyaW5nLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBzZWNvbmRzID0gMDtcbiAgICAgICAgLy8gdHVybiBob3VycyBhbmQgbWludXRlcyBpbnRvIHNlY29uZHMgYW5kIGFkZCB0aGVtIGFsbCB1cFxuICAgICAgICBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjAgKiA2MCk7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzFdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsyXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIoc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyICh2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBuZWdQID0gZmFsc2UsXG4gICAgICAgICAgICBzaWduZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIG9wdERlYyA9IGZhbHNlLFxuICAgICAgICAgICAgYWJiciA9ICcnLFxuICAgICAgICAgICAgYWJicksgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRob3VzYW5kc1xuICAgICAgICAgICAgYWJick0gPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIG1pbGxpb25zXG4gICAgICAgICAgICBhYmJyQiA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gYmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJUID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0cmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJGb3JjZSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgIGJ5dGVzID0gJycsXG4gICAgICAgICAgICBvcmQgPSAnJyxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzKHZhbHVlKSxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICBwb3dlcixcbiAgICAgICAgICAgIHcsXG4gICAgICAgICAgICBwcmVjaXNpb24sXG4gICAgICAgICAgICB0aG91c2FuZHMsXG4gICAgICAgICAgICBkID0gJycsXG4gICAgICAgICAgICBuZWcgPSBmYWxzZTtcblxuICAgICAgICAvLyBjaGVjayBpZiBudW1iZXIgaXMgemVybyBhbmQgYSBjdXN0b20gemVybyBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gMCAmJiB6ZXJvRm9ybWF0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgdXNlIHBhcmVudGhlc2VzIGZvciBuZWdhdGl2ZSBudW1iZXIgb3IgaWYgd2Ugc2hvdWxkIHByZWZpeCB3aXRoIGEgc2lnblxuICAgICAgICAgICAgLy8gaWYgYm90aCBhcmUgcHJlc2VudCB3ZSBkZWZhdWx0IHRvIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbmVnUCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJysnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgvXFwrL2csICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbiBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhYmJyZXZpYXRpb24gaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWJicksgPSBmb3JtYXQuaW5kZXhPZignYUsnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJNID0gZm9ybWF0LmluZGV4T2YoJ2FNJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyQiA9IGZvcm1hdC5pbmRleE9mKCdhQicpID49IDA7XG4gICAgICAgICAgICAgICAgYWJiclQgPSBmb3JtYXQuaW5kZXhPZignYVQnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJGb3JjZSA9IGFiYnJLIHx8IGFiYnJNIHx8IGFiYnJCIHx8IGFiYnJUO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhYmJyID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGEnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2EnLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFhYmJyRm9yY2UgfHwgYWJiclQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhYWJickZvcmNlIHx8IGFiYnJCKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhYWJickZvcmNlIHx8IGFiYnJNKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgNikgJiYgYWJzID49IE1hdGgucG93KDEwLCAzKSAmJiAhYWJickZvcmNlIHx8IGFiYnJLKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRob3VzYW5kXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBhcmUgZm9ybWF0dGluZyBieXRlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlcyA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBiJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdiJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5wb3coMTAyNCwgcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLnBvdygxMDI0LCBwb3dlcisxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzICsgc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBvcmRpbmFsIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvcmQgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgbycsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnbycsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcmQgPSBvcmQgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5vcmRpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdbLl0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0RGVjID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnWy5dJywgJy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IGZvcm1hdC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgdGhvdXNhbmRzID0gZm9ybWF0LmluZGV4T2YoJywnKTtcblxuICAgICAgICAgICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24uaW5kZXhPZignWycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnJlcGxhY2UoJ10nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5zcGxpdCgnWycpO1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgKHByZWNpc2lvblswXS5sZW5ndGggKyBwcmVjaXNpb25bMV0ubGVuZ3RoKSwgcm91bmRpbmdGdW5jdGlvbiwgcHJlY2lzaW9uWzFdLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbi5sZW5ndGgsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHcgPSBkLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoZC5zcGxpdCgnLicpWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICsgZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0RGVjICYmIE51bWJlcihkLnNsaWNlKDEpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ID0gdG9GaXhlZCh2YWx1ZSwgbnVsbCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvcm1hdCBudW1iZXJcbiAgICAgICAgICAgIGlmICh3LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRob3VzYW5kcyA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcudG9TdHJpbmcoKS5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyg/IVxcZCkpL2csICckMScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLnRob3VzYW5kcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdyA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKChuZWdQICYmIG5lZykgPyAnKCcgOiAnJykgKyAoKCFuZWdQICYmIG5lZykgPyAnLScgOiAnJykgKyAoKCFuZWcgJiYgc2lnbmVkKSA/ICcrJyA6ICcnKSArIHcgKyBkICsgKChvcmQpID8gb3JkIDogJycpICsgKChhYmJyKSA/IGFiYnIgOiAnJykgKyAoKGJ5dGVzKSA/IGJ5dGVzIDogJycpICsgKChuZWdQICYmIG5lZykgPyAnKScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBudW1lcmFsID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmIChudW1lcmFsLmlzTnVtZXJhbChpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudmFsdWUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gMCB8fCB0eXBlb2YgaW5wdXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoIU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gbnVtZXJhbC5mbi51bmZvcm1hdChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IE51bWVyYWwoTnVtYmVyKGlucHV0KSk7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbnVtZXJhbC52ZXJzaW9uID0gVkVSU0lPTjtcblxuICAgIC8vIGNvbXBhcmUgbnVtZXJhbCBvYmplY3RcbiAgICBudW1lcmFsLmlzTnVtZXJhbCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE51bWVyYWw7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgJiYgIXZhbHVlcykge1xuICAgICAgICAgICAgaWYoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVzIHx8ICFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgIH07XG4gICAgXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGxvYWRlZCBsYW5ndWFnZSBkYXRhLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50XG4gICAgLy8gZ2xvYmFsIGxhbmd1YWdlIG9iamVjdC5cbiAgICBudW1lcmFsLmxhbmd1YWdlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSgnZW4nLCB7XG4gICAgICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogJywnLFxuICAgICAgICAgICAgZGVjaW1hbDogJy4nXG4gICAgICAgIH0sXG4gICAgICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kOiAnaycsXG4gICAgICAgICAgICBtaWxsaW9uOiAnbScsXG4gICAgICAgICAgICBiaWxsaW9uOiAnYicsXG4gICAgICAgICAgICB0cmlsbGlvbjogJ3QnXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGluYWw6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgICAgICByZXR1cm4gKH5+IChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICBzeW1ib2w6ICckJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBudW1lcmFsLnplcm9Gb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHplcm9Gb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiBudWxsO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmRlZmF1bHRGb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiAnMC4wJztcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGxhbmd1YWdlc1trZXldID0gdmFsdWVzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmxvYXRpbmctcG9pbnQgaGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIFRoZSBmbG9hdGluZy1wb2ludCBoZWxwZXIgZnVuY3Rpb25zIGFuZCBpbXBsZW1lbnRhdGlvblxuICAgIC8vIGJvcnJvd3MgaGVhdmlseSBmcm9tIHNpbmZ1bC5qczogaHR0cDovL2d1aXBuLmdpdGh1Yi5pby9zaW5mdWwuanMvXG5cbiAgICAvKipcbiAgICAgKiBBcnJheS5wcm90b3R5cGUucmVkdWNlIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9SZWR1Y2UjQ29tcGF0aWJpbGl0eVxuICAgICAqL1xuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChudWxsID09PSB0aGlzIHx8ICd1bmRlZmluZWQnID09PSB0eXBlb2YgdGhpcykge1xuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBtb21lbnQgYWxsIG1vZGVybiBicm93c2VycywgdGhhdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIG9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UuIEZvciBpbnN0YW5jZSwgSUU4XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCBzdHJpY3QgbW9kZSwgc28gdGhpcyBjaGVjayBpcyBhY3R1YWxseSB1c2VsZXNzLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5yZWR1Y2UgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDAsXG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBsZW5ndGggPiBpbmRleDsgKytpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgdGhpc1tpbmRleF0sIGluZGV4LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIG11bHRpcGxpZXIgbmVjZXNzYXJ5IHRvIG1ha2UgeCA+PSAxLFxuICAgICAqIGVmZmVjdGl2ZWx5IGVsaW1pbmF0aW5nIG1pc2NhbGN1bGF0aW9ucyBjYXVzZWQgYnlcbiAgICAgKiBmaW5pdGUgcHJlY2lzaW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG11bHRpcGxpZXIoeCkge1xuICAgICAgICB2YXIgcGFydHMgPSB4LnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgcGFydHNbMV0ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMsIHJldHVybnMgdGhlIG1heGltdW1cbiAgICAgKiBtdWx0aXBsaWVyIHRoYXQgbXVzdCBiZSB1c2VkIHRvIG5vcm1hbGl6ZSBhbiBvcGVyYXRpb24gaW52b2x2aW5nXG4gICAgICogYWxsIG9mIHRoZW0uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29ycmVjdGlvbkZhY3RvcigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gYXJncy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBtcCA9IG11bHRpcGxpZXIocHJldiksXG4gICAgICAgICAgICAgICAgbW4gPSBtdWx0aXBsaWVyKG5leHQpO1xuICAgICAgICByZXR1cm4gbXAgPiBtbiA/IG1wIDogbW47XG4gICAgICAgIH0sIC1JbmZpbml0eSk7XG4gICAgfSAgICAgICAgXG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTnVtZXJhbCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIG51bWVyYWwuZm4gPSBOdW1lcmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZywgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWVyYWwodGhpcywgXG4gICAgICAgICAgICAgICAgICBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCwgXG4gICAgICAgICAgICAgICAgICAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5mb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXRTdHJpbmcpID09PSAnW29iamVjdCBOdW1iZXJdJykgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRTdHJpbmc7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZm9ybWF0TnVtZXJhbCh0aGlzLCBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSArIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDApIC8gY29yckZhY3RvcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtIC0gY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt2YWx1ZV0ucmVkdWNlKGNiYWNrLCB0aGlzLl92YWx1ZSAqIGNvcnJGYWN0b3IpIC8gY29yckZhY3RvcjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIG11bHRpcGx5IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAqIChjdXJyICogY29yckZhY3RvcikgL1xuICAgICAgICAgICAgICAgICAgICAoY29yckZhY3RvciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGl2aWRlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAvIChjdXJyICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjayk7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmZXJlbmNlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMobnVtZXJhbCh0aGlzLl92YWx1ZSkuc3VidHJhY3QodmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBOdW1lcmFsXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZW5kZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG51bWVyYWxgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgJ2FkdmFuY2VkJyBtb2RlXG4gICAgICAgIHRoaXNbJ251bWVyYWwnXSA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgICAgICB9KTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoganNoaW50IG1heGNvbXBsZXhpdHk6MTQgKi9cclxuLyoqXHJcbiAgICBGb3JtYXQgZXh0ZW5kZXIgZm9yIEtub2Nrb3V0IG9ic2VydmFibGVzLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gICAgVGhlIGV4dGVuZGVyIHR5cGVzIGFyZSBkZWZpbmVkIGV4dGVybmFsbHkgYW5kIHJlZ2lzdGVyZWRcclxuICAgIGluICd0eXBlcycgd2l0aCBlYWNoIHByb3BlcnR5IHRoZSBuYW1lIG9mIHRoZSB0eXBlIGFuZCB0aGUgdmFsdWVcclxuICAgIHRoZSBmdW5jdGlvbiBpbXBsZW1lbnRpbmcgaXQuXHJcbioqL1xyXG5leHBvcnRzLnR5cGVzID0ge307XHJcblxyXG4vKipcclxuICAgIEtub2Nrb3V0IGV4dGVuZGVyLCB0byBhdHRhY2ggdG8ga28uZXh0ZW5kZXJzIHdpdGggdGhlIGRlc2lyZWRcclxuICAgIG5hbWUgKGZvciBleGFtcGxlOiAndHlwZScgOi0pXHJcbioqL1xyXG5leHBvcnRzLmZvcm1hdEJpbmRpbmcgPSB7XHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzKSB7XHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ga28udW53cmFwKHZhbHVlQWNjZXNzb3IoKSksXHJcbiAgICAgICAgICAgIHZhbHVlID0ga28udW53cmFwKGFsbEJpbmRpbmdzLmdldCgndGV4dCcpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgYXBwbHlGb3JtYXQodmFsdWUsIGVsZW1lbnQsIG9wdGlvbnMsIGtvLmRhdGFGb3IoZWxlbWVudCkpO1xyXG5cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGFwcGx5Rm9ybWF0KHZhbHVlLCBlbGVtZW50LCBvcHRpb25zLCBkYXRhQ29udGV4dCkge1xyXG5cclxuICAgIHZhciB0eXBlID0ga28udW53cmFwKG9wdGlvbnMudHlwZSk7XHJcblxyXG4gICAgaWYgKHR5cGUgJiYgdmFsdWUgJiYgdHlwZSBpbiBleHBvcnRzLnR5cGVzKSB7XHJcblxyXG4gICAgICAgIHZhciB0eXBlRm9ybWF0dGVyID0gZXhwb3J0cy50eXBlc1t0eXBlXTtcclxuICAgICAgICB2YXIgc3RyID0gdHlwZUZvcm1hdHRlci5mb3JtYXQodmFsdWUsIG9wdGlvbnMsIGtvLmRhdGFGb3IoZWxlbWVudCkpO1xyXG5cclxuICAgICAgICBpZiAoJ2h0bWwnIGluIHR5cGVGb3JtYXR0ZXIgJiYgdHlwZUZvcm1hdHRlci5odG1sID09PSB0cnVlKVxyXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmh0bWwoc3RyKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkudGV4dChzdHIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiogRGVmaW5pdGlvbiBvZiBzZXZlcmFsIHR5cGVzICovIFxyXG5leHBvcnRzLnR5cGVzLmxpbmsgPSB7XHJcbiAgICBodG1sOiB0cnVlLFxyXG4gICAgZm9ybWF0OiBmdW5jdGlvbiBMaW5rRm9ybWF0dGVyKHZhbHVlLCBkZWYsIGRhdGFDb250ZXh0KSB7XHJcbiAgICBcclxuICAgICAgICB2YXIgbGluayA9IGRlZiA/IGRlZi5saW5rID8gZGVmLmxpbmsgOiBkZWYgOiBudWxsO1xyXG4gICAgICAgIGxpbmsgPSB0eXBlb2YobGluaykgPT09ICdzdHJpbmcnID8gbGluayA6IG51bGw7XHJcbiAgICAgICAgdmFyIHIgPSB2YWx1ZTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobGluaykge1xyXG4gICAgICAgICAgICByID0gJCgnPGEvPicpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHRpdGxlID0gZGVmID8gZGVmLnRpdGxlID8gZGVmLnRpdGxlIDogbnVsbCA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBkZWYgPyBkZWYudGFyZ2V0ID8gZGVmLnRhcmdldCA6IG51bGwgOiBudWxsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgci5hdHRyKCdocmVmJywgbGluay5yZXBsYWNlKC9fX3ZhbHVlX18vZywgdmFsdWUpKTtcclxuICAgICAgICAgICAgaWYgKHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgci5hdHRyKCd0aXRsZScsIHRpdGxlLnJlcGxhY2UoL19fdmFsdWVfXy9nLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgci5hdHRyKCd0YXJnZXQnLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGRhdGFDb250ZXh0IHBsYWNlaG9sZGVyc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGRlZi5jb250ZW50Rm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICBhcHBseUZvcm1hdCh2YWx1ZSwgciwgZGVmLmNvbnRlbnRGb3JtYXQsIGRhdGFDb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHIudGV4dCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHIgPSByLm91dGVySHRtbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbmV4cG9ydHMudHlwZXMuZGF0ZXRpbWUgPSB7XHJcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uIERhdGVUaW1lRm9ybWF0dGVyKHZhbHVlLCBkZWYsIGRhdGFDb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghdmFsdWUpXHJcbiAgICAgICAgICAgIHJldHVybiBkZWYuZGVmYXVsdCB8fCBkZWYuaW52YWxpZCB8fCAnJztcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZHQgPSBtb21lbnQodmFsdWUpO1xyXG4gICAgICAgIHJldHVybiBkdC5pc1ZhbGlkKCkgPyBkdC5mb3JtYXQoZGVmLmZvcm1hdCkgOiBkZWYuaW52YWxpZCB8fCAnJztcclxuICAgIH1cclxufTtcclxuICAgIFxyXG5leHBvcnRzLnR5cGVzLmNvbmNhdCA9IHtcclxuICAgIGZvcm1hdDogZnVuY3Rpb24gQ29uY2F0Rm9ybWF0dGVyKHZhbHVlLCBkZWYsIGRhdGFDb250ZXh0KSB7XHJcblxyXG4gICAgICAgIHZhciBmaWVsZHMgPSAkLm1hcChkZWYuZm9ybWF0LCBmdW5jdGlvbih2LCBpKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGlzIG5vdCBhIGxpdGVyYWwgKGJldHdlZW4gY29taWxlcyksIGlzIGEgZmllbGRcclxuICAgICAgICAgICAgLy8gd2UgbmVlZCB0aGUgdmFsdWUgZnJvbSB0aGUgc291cmNlIGFuZCBwdXQgaXQgaW4gdGhlIGxpc3RcclxuICAgICAgICAgICAgdmFyIG1hdGNoID0gL1tcIiddKC4qKVtcIiddLy5leGVjKHYpO1xyXG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gubGVuZ3RoID4gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFsxXTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFDb250ZXh0W3ZdO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmllbGRzLmpvaW4oJycpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7ICAgIFxyXG5leHBvcnRzLnR5cGVzLm51bWJlciA9IHtcclxuICAgIGZvcm1hdDogZnVuY3Rpb24gTnVtYmVyRm9ybWF0dGVyKHZhbHVlLCBkZWYsIGRhdGFDb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bWVyYWwodmFsdWUpLmZvcm1hdChkZWYuZm9ybWF0KTtcclxuICAgIH1cclxufTtcclxuICAgIFxyXG5leHBvcnRzLnR5cGVzLmJvb2wgPSB7XHJcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uIEJvb2xGb3JtYXR0ZXIodmFsdWUsIGRlZiwgZGF0YUNvbnRleHQpIHtcclxuICAgICAgICB2YXIgdnMgPSBkZWYudmFsdWVzO1xyXG4gICAgICAgIGlmICghdnMgfHwgdnMubGVuZ3RoICE9PSAyKVxyXG4gICAgICAgICAgICB2cyA9IFsndHJ1ZScsICdmYWxzZSddO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWUgPyB2c1swXSA6IHZzWzFdO1xyXG4gICAgfVxyXG59O1xyXG4iXX0=
;