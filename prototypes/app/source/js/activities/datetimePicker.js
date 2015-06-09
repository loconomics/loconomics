/**
    datetimePicker activity
**/
'use strict';

var ko = require('knockout'),
    //moment = require('moment'),
    Time = require('../utils/Time');
require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function DatetimePickerActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('', {
        helpId: 'datetimePickerHelp'
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();
    
    // Getting elements
    this.$datePicker = this.$activity.find('#datetimePickerDatePicker');
    this.$timePicker = this.$activity.find('#datetimePickerTimePicker');
    
    /* Init components */
    this.$datePicker.show().datepicker({ extraClasses: 'DatePicker--tagged' });
    
    this.registerHandler({
        target: this.$datePicker,
        event: 'dateChanged',
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
    
    // Like in calendar:
    // TODO Deduplicate
    // TODO terrible performance, very click launchs this even if already done
    this.registerHandler({
        target: this.$datePicker,
        event: 'dayRendered',
        handler: function(e, $dateTd) {
            var id = $dateTd.data('date-time');
            // Get availability info
            this.app.model.calendar.getDateAvailability(new Date(id))
            .then(function(dateAvail) {
                /*jshint maxcomplexity:8*/
                // If still the same (is async, could have changed)
                if (id === $dateTd.data('date-time')) {
                    var cls = '';
                    switch(dateAvail.availableTag()) {
                        case 'past':
                            cls = 'tag-muted';
                            break;
                        case 'full':
                            cls = 'tag-blank';
                            break;
                        case 'medium':
                            cls = 'tag-dark';
                            break;
                        case 'low':
                            cls = 'tag-warning';
                            break;
                        case 'none':
                            cls = 'tag-danger';
                            break;
                    }
                    if (cls) $dateTd.addClass(cls);
                }
            });
        }.bind(this)
    });
    
    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
    
    this.bindDateData(new Date());
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    var header = this.requestData.headerText;
    this.viewModel.headerText(header || 'Select date and time');

    if (this.requestData.title) {
        // Replace title
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
        this.navBar.leftAction().text(this.requestData.navTitle || '');
    }
    
    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction);
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    if (!this.__firstShowDone) {
        this.__firstShowDone = true;
        // Force first refresh on datepicker to allow
        // event handlers to get notified on first time:
        this.$datePicker.datepicker('fill');
    }
    
    this.updateNavBarState();
    
    // Keep data updated:
    this.app.model.schedulingPreferences.sync();
};

A.prototype.bindDateData = function bindDateData(date) {

    this.viewModel.isLoading(true);
    this.app.model.calendar.getDateAvailability(date)
    .then(function(data) {
        
        this.viewModel.dateAvail(data);
        
        /*var sdate = moment(date).format('YYYY-MM-DD');
        this.viewModel.slots(data.slots.map(function(slot) {
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
        this.viewModel.isLoading(false);
    }.bind(this));
};

function ViewModel(app) {
    
    this.schedulingPreferences = app.model.schedulingPreferences.data;

    this.headerText = ko.observable('Select a time');
    this.selectedDate = ko.observable(new Date());
    this.isLoading = ko.observable(false);

    this.dateAvail = ko.observable();
    this.groupedSlots = ko.computed(function(){
        
        var incSize = this.schedulingPreferences.incrementsSizeInMinutes();
        
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
        var slots = this.dateAvail() && this.dateAvail().getFreeTimeSlots(incSize) || [];
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
        
        this.selectedDatetime(selectedDatetime);
        
        event.preventDefault();
        event.stopImmediatePropagation();

    }.bind(this);

}
