/**
    datetimePicker activity
**/
'use strict';

var moment = require('moment'),
    ko = require('knockout'),
    Time = require('../utils/Time');
require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function DatetimePickerActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('');
    
    // Getting elements
    this.$datePicker = this.$activity.find('#datetimePickerDatePicker');
    this.$timePicker = this.$activity.find('#datetimePickerTimePicker');
    
    /* Init components */
    this.$datePicker.show().datepicker();
    
    this.registerHandler({
        target: this.$datePicker,
        event: 'changeDate',
        handler: function(e) {
            if (e.viewMode === 'days') {
                this.viewModel.selectedDate(e.date);
            }
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.viewModel.selectedDate,
        handler: function(date) {
            this.bindDateData(date);
        }.bind(this)
    });
    
    // Handler to go back with the selected date-time when
    // that selection is done (could be to null)
    this.registerHandler({
        target: this.viewModel.selectedDatetime,
        handler: function (datetime) {
            if (!this.requestData ||
                !datetime) {
                return;
            }
            // Pass the selected datetime in the info
            this.requestData.selectedDatetime = datetime;
            // And go back
            this.app.shell.goBack(this.requestData);
            // Last, clear requestData
            this.requestData = null;
        }.bind(this)
    });
    
    // TestingData
    this.viewModel.slotsData = require('../testdata/timeSlots').timeSlots;
    
    this.bindDateData(new Date());
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var header = this.requestData.headerText;
    this.viewModel.headerText(header || 'Select date and time');
};

A.prototype.bindDateData = function bindDateData(date) {

    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.viewModel.slotsData;

    if (slotsData.hasOwnProperty(sdate)) {
        this.viewModel.slots(slotsData[sdate]);
    } else {
        this.viewModel.slots(slotsData['default']);
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
        // TODO Empty slots must appear with
        // 'empty' message rather than excluded
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
    
    this.selectedDatetime = ko.observable(null);
    
    this.selectDatetime = function(selectedDatetime) {
        
        this.selectedDatetime(selectedDatetime);

    }.bind(this);

}
