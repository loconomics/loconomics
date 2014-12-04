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
