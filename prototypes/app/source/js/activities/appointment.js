/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout');
require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function AppointmentActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;    
    this.menuItem = 'calendar';
    
    // Create a specific backAction that shows current date
    // and return to calendar in current date.
    // Later some more changes are applied, with viewmodel ready
    var backAction = new Activity.NavAction({
        link: 'calendar/', // Preserve last slash, for later use
        icon: Activity.NavAction.goBack.icon(),
        isTitle: true,
        text: 'Calendar'
    });
    this.navBar = new Activity.NavBar({
        title: '',
        leftAction: backAction,
        rightAction: Activity.NavAction.goHelpIndex
    });
    
    this.$appointmentView = this.$activity.find('#calendarAppointmentView');
    this.$chooseNew = $('#calendarChooseNew');
    
    this.viewModel = new ViewModel(this.app);
    // TODO Remove test Data
    //this.viewModel.appointments(require('../testdata/calendarAppointments').appointments);
    
    // This title text is dynamic, we need to replace it by a computed observable
    // showing the current date
    var defBackText = backAction.text._initialValue;
    backAction.text = ko.computed(function() {

        var d = this.viewModel.currentDate();
        if (!d)
            // Fallback to the default title
            return defBackText;

        var m = moment(d);
        var t = m.format('dddd [(]M/D[)]');
        return t;
    }, this);
    // And the link is dynamic too, to allow return to the date
    // that matches current appointment
    var defLink = backAction.link._initialValue;
    backAction.link = ko.computed(function() {

        var d = this.viewModel.currentDate();
        if (!d)
            // Fallback to the default link
            return defLink;

        return defLink + d.toISOString();
    }, this);
    
    this.registerHandler({
        target: this.viewModel.currentAppointment,
        handler: function (apt) {
            
            if (!apt)
                return;
            
            // Update URL to match the appointment ID and
            // track it state
            // Get ID from URL, to avoid do anything if the same.
            var aptId = apt.id();
            var urlId = /appointment\/(\d+)/i.test(window.location);
            urlId = urlId && urlId[1] || '';
            if (urlId !== '0' && aptId !== null && urlId !== aptId.toString()) {

                // TODO save a useful state
                // Not for now, is failing, but something based on:
                /*
                var viewstate = {
                    appointment: apt.model.toPlainObject(true)
                };
                */

                // If was a root URL, no ID, just replace current state
                if (urlId === '')
                    this.app.shell.history.replaceState(null, null, 'appointment/' + aptId);
                else
                    this.app.shell.history.pushState(null, null, 'appointment/' + aptId);
            }

            // Trigger a layout update, required by the full-height feature
            $(window).trigger('layoutUpdate');
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.viewModel.editMode,
        handler: function(isEdit) {
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);

            if (isEdit) {
                // Create a copy of the appointment so we revert on 'cancel'
                this.viewModel.originalEditedAppointment = 
                    ko.toJS(this.viewModel.currentAppointment());
            }

        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */

    Activity.prototype.show.call(this, options);
    
    var apt;
    if (this.requestData.appointment) {
        apt = this.requestData.appointment;
    } else {
        // Get ID
        var aptId = options && options.route && options.route.segments[0];
        aptId = parseInt(aptId, 10);
        apt = aptId || 0;
    }
    this.showAppointment(apt);
    
    // If there are options (may not be on startup or
    // on cancelled edition).
    if (options !== null) {

        var booking = this.viewModel.currentAppointment();
        // It comes back from the textEditor.
        if (options.request === 'textEditor' && booking) {

            booking[options.field](options.text);
        }
        else if (options.selectClient === true && booking) {

            booking.client(options.selectedClient);
        }
        else if (typeof(options.selectedDatetime) !== 'undefined' && booking) {

            booking.startTime(options.selectedDatetime);
            // TODO Calculate the endTime given an appointment duration, retrieved from the
            // selected service
            //var duration = booking.pricing && booking.pricing.duration;
            // Or by default (if no pricing selected or any) the user preferred
            // time gap
            //duration = duration || user.preferences.timeSlotsGap;
            // PROTOTYPE:
            var duration = 60; // minutes
            booking.endTime(moment(booking.startTime()).add(duration, 'minutes').toDate());
        }
        else if (options.selectServices === true && booking) {

            booking.services(options.selectedServices);
        }
        else if (options.selectLocation === true && booking) {

            booking.location(options.selectedLocation);
        }
    }
};

var Appointment = require('../models/Appointment');

A.prototype.showAppointment = function showAppointment(apt) {

    if (typeof(apt) === 'number') {
        if (apt) {
            // TODO: select appointment apt ID

        } else if (apt === 0) {
            this.viewModel.newAppointment(new Appointment());
            this.viewModel.editMode(true);
        }
    }
    else {
        // Appointment object
        if (apt.id) {
            // TODO: select appointment by apt id
            // TODO: then update values with in-editing values from apt
        }
        else {
            // New apopintment with the in-editing values
            this.viewModel.newAppointment(new Appointment(apt));
            this.viewModel.editMode(true);
        }
    }
};

function getDateWithoutTime(date) {
    date = date || new Date();
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
    );
}

function ViewModel(app) {
    /*jshint maxstatements: 30 */

    this.appointments = ko.observableArray([]);
    this.currentIndex = ko.observable(0);
    this.editMode = ko.observable(false);
    this.newAppointment = ko.observable(null);
    this.noAppointment = new Appointment({
        id: -1,
        summary: 'There is no appointments on this date'
    });

    this.isNew = ko.computed(function(){
        return this.newAppointment() !== null;
    }, this);

    this.currentAppointment = ko.computed({
        read: function() {
            if (this.isNew()) {
                return this.newAppointment();
            }
            else {
                var apt = this.appointments()[this.currentIndex() % this.appointments().length];
                if (!apt)
                    return this.noAppointment;
                return apt;
            }
        },
        write: function(apt) {
            var index = this.currentIndex() % this.appointments().length;
            this.appointments()[index] = apt;
            this.appointments.valueHasMutated();
        },
        owner: this
    });

    this.originalEditedAppointment = {};

    this.goPrevious = function goPrevious() {
        if (this.editMode()) return;

        if (this.currentIndex() === 0)
            this.currentIndex(this.appointments().length - 1);
        else
            this.currentIndex((this.currentIndex() - 1) % this.appointments().length);
    };

    this.goNext = function goNext() {
        if (this.editMode()) return;

        this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
    };

    this.edit = function edit() {
        this.editMode(true);
    }.bind(this);

    this.cancel = function cancel() {

        // if is new, discard
        if (this.isNew()) {
            this.newAppointment(null);
        }
        else {
            // revert changes
            this.currentAppointment(new Appointment(this.originalEditedAppointment));
        }

        this.editMode(false);
    }.bind(this);

    this.save = function save() {
        // If is a new one, add it to the collection
        if (this.isNew()) {

            var newApt = this.newAppointment();
            // TODO: some fieds need some kind of calculation that is persisted
            // son cannot be computed. Simulated:
            newApt.summary('Massage Therapist Booking');
            newApt.id(4);

            // Add to the list:
            this.appointments.push(newApt);
            // now, reset
            this.newAppointment(null);
            // current index must be the just-added apt
            this.currentIndex(this.appointments().length - 1);

            // On adding a new one, the confirmation page must be showed
            app.shell.go('bookingConfirmation', {
                booking: newApt
            });
        }

        this.editMode(false);
    }.bind(this);

    this.currentDate = ko.observable(new Date());
    this.currentAppointment.subscribe(function(apt) {

        var newDate = null,
            curDate = this.currentDate();
        
        if (apt && apt.startTime())
            newDate = getDateWithoutTime(apt.startTime());

        // Update date with the new from current appointment
        // or keep the current date, with latest fallback to the current date
        newDate = newDate || curDate || getDateWithoutTime();
        
        if (newDate.toISOString() !== curDate.toISOString()) {
            this.currentDate(newDate);
        }
        
    }, this);

    /**
        External actions
    **/
    var editFieldOn = function editFieldOn(activity, data) {

        // Include appointment to recover state on return:
        data.appointment = this.currentAppointment().model.toPlainObject(true);

        app.shell.go(activity, data);
    };

    this.pickDateTime = function pickDateTime() {

        editFieldOn('datetimePicker', {
            selectedDatetime: null
        });
    };

    this.pickClient = function pickClient() {

        editFieldOn('clients', {
            selectClient: true,
            selectedClient: null
        });
    };

    this.pickService = function pickService() {

        editFieldOn('services', {
            selectServices: true,
            selectedServices: this.currentAppointment().services()
        });
    }.bind(this);

    this.changePrice = function changePrice() {
        // TODO
    };

    this.pickLocation = function pickLocation() {

        editFieldOn('locations', {
            selectLocation: true,
            selectedLocation: this.currentAppointment().location()
        });
    }.bind(this);

    var textFieldsHeaders = {
        preNotesToClient: 'Notes to client',
        postNotesToClient: 'Notes to client (afterwards)',
        preNotesToSelf: 'Notes to self',
        postNotesToSelf: 'Booking summary'
    };

    this.editTextField = function editTextField(field) {

        editFieldOn('textEditor', {
            request: 'textEditor',
            field: field,
            title: this.isNew() ? 'New booking' : 'Booking',
            header: textFieldsHeaders[field],
            text: this.currentAppointment()[field]()
        });
    }.bind(this);
    

    // Data Updates
    this.isLoading = ko.observable(false);
    // on currentDate changes:
    // NOTE: Lot of code shared with calendar.js
    var previousDate = this.currentDate();
    previousDate = previousDate && previousDate.toISOString();
    this.currentDate.subscribe(function (date) {
        
        if (!date) {
            this.appointments([]);
            return;
        }
        
        // IMPORTANT: The date object may be reused and mutated between calls
        // (mostly because the widget I think), so is better to create
        // a clone and avoid getting race-conditions in the data downloading.
        date = new Date(date.toISOString());

        // Avoid duplicated notification, un-changed date
        if (date.toISOString() === previousDate) {
            return;
        }
        previousDate = date.toISOString();

        this.isLoading(true);
        
        app.model.appointments.getAppointmentsByDate(date)
        .then(function(appointmentsList) {
            
            // IMPORTANT: First, we need to check that we are
            // in the same date still, because several loadings
            // can happen at a time (changing quickly from date to date
            // without wait for finish), avoiding a race-condition
            // that create flickering effects or replace the date events
            // by the events from other date, because it tooks more an changed.
            // TODO: still this has the minor bug of losing the isLoading
            // if a previous triggered load still didn't finished; its minor
            // because is very rare that happens, moving this stuff
            // to a special appModel for mixed bookings and events with 
            // per date cache that includes a view object with isLoading will
            // fix it and reduce this complexity.
            if (date.toISOString() !== this.currentDate().toISOString()) {
                // Race condition, not the same!! out:
                return;
            }
        
            if (appointmentsList && appointmentsList.length) {
                // Update the source:
                this.appointments(appointmentsList);
                this.isLoading(false);
            }
            else {
                this.appointments([]);
                this.isLoading(false);
            }

        }.bind(this))
        .catch(function(err) {
            
            // Show free on error
            this.appointments([]);
            this.isLoading(false);
            
            var msg = 'Error loading calendar events.';
            app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
            
        }.bind(this));

    }.bind(this));
}
