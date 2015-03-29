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
    
    /*this.registerHandler({
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
                * /

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
    /*this.currentAppointment.subscribe(function(apt) {

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
    */

    // Update  on currentDate changes:
    // NOTE: Lot of code shared with calendar.js
    var previousDate = this.viewModel.currentDate();
    previousDate = previousDate && previousDate.toISOString();
    var app = this.app;
    this.registerHandler({
        target: this.viewModel.currentDate,
        handler: function (date) {
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

                // New date list must start with the first ID of the list:
                // Put current ID to zero forcing
                // currentAppointment to look for the first in the
                // new list
                this.currentID(0);
                // Update the source, it will update currentAppointment too:
                this.appointments(appointmentsList || []);

                this.isLoading(false);

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

        }.bind(this.viewModel)
    });
    
    var ModelVersion = require('../utils/ModelVersion');

    this.registerHandler({
        target: this.viewModel.editMode,
        handler: function(isEdit) {
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);

            if (this.viewModel.currentID() <= 0) {
                return;
            }
            
            var version;
            
            if (isEdit) {
                // Create and set a version to be edited
                version = new ModelVersion(this.viewModel.currentAppointment());
                this.viewModel.editedVersion(version);
                this.viewModel.editedAppointment(version.version);
                
                // Setup auto-saving
                var vw = this.viewModel;
                version.on('push', function(success) {
                    if (success) {
                        vw.isSaving(true);
                        app.model.appointments.setAppointment(version.version)
                        .then(function(savedApt) {
                            //var wasNew = version.original.id() < 1;
                            // Update with remote data, the original appointment in the version,
                            // not the currentAppointment or in the index in the list to avoid
                            // race-conditions
                            version.original.model.updateWith(savedApt);
                            
                            // TODO: wasNew:true: add to the list and sort it??
                            // There is a wizard for bookings, so may be different on that case
                        })
                        .catch(function(err) {
                            // Show error
                            app.modals.showError({
                                title: 'There was an error saving the data.',
                                error: err && err.error || err
                            });
                            // Don't replicate error, allow always
                        })
                        .then(function() {
                            // ALWAYS:
                            vw.isSaving(false);
                        });
                    }
                });
            }
            else {
                // There is a version? Push changes!
                version = this.viewModel.editedVersion();
                
                if (version && version.areDifferent()) {
                    // Push version to original, will launch a remote update 
                    // if anithing changed
                    // TODO: ask for confirmation if version isObsolete
                    version.push({ evenIfObsolete: true });
                }
            }

        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    Activity.prototype.show.call(this, options);
    
    var date = getDateWithoutTime(options && options.route && options.route.segments[0]);
    var id = (options && options.route && options.route.segments[1]) |0;

    this.viewModel.currentDate(date);
    this.viewModel.currentID(id);
    
    // If the request includes an appointment plain object, that's an
    // in-editing appointment so put it in place (to restore a previous edition)
    if (this.requestData.appointment) {
        this.viewModel.editMode(true);
        this.viewModel.editedAppointment().model.updateWith(this.requestData.appointment);
    }

    // If there are options (may not be on startup or
    // on cancelled edition).
    /*if (options !== null) {

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
    }*/
};

var Appointment = require('../models/Appointment');

function getDateWithoutTime(date) {
    if (!date) {
        date = new Date();
    }
    else if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
    );
}

function findAppointmentInList(list, id) {
    var found = null,
        index = -1;
    list.some(function(apt, i) {
        if (apt.id() === id) {
            found = apt;
            index = i;
            return true;
        }
    });
    return {
        item: found,
        index: index
    };
}

var CalendarEvent = require('../models/CalendarEvent'),
    Booking = require('../models/Booking');

function ViewModel(app) {
    /*jshint maxstatements: 30 */

    this.appointments = ko.observableArray([]);
    this.currentDate = ko.observable(new Date());
    this.currentID = ko.observable(0);
    this.currentIndex = ko.observable(0);
    this.editMode = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.editedVersion = ko.observable(null);
    this.editedAppointment = ko.observable(new Appointment());

    var loadingAppointment = new Appointment({
        id: 0,
        summary: 'Loading...'
    });
    var newEmptyDateAppointment = function newEmptyDateAppointment() {
        return new Appointment({
            id: -1,
            summary: 'There is no appointments on this date',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newFreeAppointment = function newFreeAppointment() {
        return new Appointment({
            id: -2,
            summary: 'Free',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newEventAppointment = function newEventAppointment() {
        return new Appointment({
            id: -3,
            summary: 'New event...',
            sourceEvent: new CalendarEvent()
        });
    };
    var newBookingAppointment = function newBookingAppointment() {
        return new Appointment({
            id: -4,
            summary: 'New booking...',
            sourceEvent: new CalendarEvent(),
            sourceBooking: new Booking()
        });
    };

    this.isNew = ko.computed(function(){
        return this.currentID() === -3 || this.currentID() === -4;
    }, this);

    this.currentAppointment = ko.computed(function() {
        /*jshint maxcomplexity: 10*/

        var id = this.currentID(),
            // Important, used in the search but too required
            // to be a dependency when the list changes (to update
            // from the 'loadingAppointment'):
            apts = this.appointments();

        switch (id) {
            case -1:
                return newEmptyDateAppointment();
            case -2:
                return newFreeAppointment();
            case -3:
                this.editMode(true);
                return newEventAppointment();
            case -4:
                this.editMode(true);
                return newBookingAppointment();
            case -5:
                return loadingAppointment;
            default:
                // Positive ID: set a temporary/loading apt
                // and search for the ID
                if (id > 0) {
                    // Trigger inmediate search if not in loading
                    if (!this.isLoading()) {
                        // search in list and set index
                        var found = findAppointmentInList(apts, id);
                        this.currentIndex(found.index);
                        return found.item;
                    }
                    return loadingAppointment;
                }
                else {
                    // 0 or any other value:
                    // look first in list
                    if (this.appointments().length === 0) {
                        // empty date -> -1
                        setTimeout(function(){
                            this.currentID(-1);
                        }.bind(this), 0);
                        this.currentIndex(-1);
                        return newEmptyDateAppointment();
                    }
                    else {
                        setTimeout(function(){
                            this.currentID(this.appointments()[0].id());
                            this.currentIndex(0);
                        }.bind(this), 0);
                        // Waiting for load:
                        return loadingAppointment;
                    }
                }
        }
    }, this)
    // Avoiding multiple evaluations because of consecutive updates on the observables
    .extend({ rateLimit: 0 });

    this.goPrevious = function goPrevious() {
        if (this.editMode()) return;

        var index = this.currentIndex() - 1;

        if (index < 0) {
            // Go previous date
            // First change ID to be 'loading' to show state and 
            // allow for auto look-up on loading finish.
            this.currentID(-5);
            // Calculate previous date
            var m = moment(this.currentDate());
            if (m.isValid()) {
                this.currentDate(m.subtract(1, 'days').toDate());
            }
            else {
                // Error fallback to today
                this.currentDate(getDateWithoutTime());
            }
        }
        else {
            // Go previous item in the list, by changing currentID
            var apt = this.appointments()[index % this.appointments().length];
            this.currentID(apt.id());
        }
    };

    this.goNext = function goNext() {
        if (this.editMode()) return;
        var index = this.currentIndex() + 1;

        if (index >= this.appointments().length) {
            // Go next date
            // First change ID to be 'loading' to show state and 
            // allow for auto look-up on loading finish.
            this.currentID(-5);
            // Calculate next date
            var m = moment(this.currentDate());
            if (m.isValid()) {
                this.currentDate(m.add(1, 'days').toDate());
            }
            else {
                // Error fallback to today
                this.currentDate(getDateWithoutTime());
            }
        }
        else {
            // Go next item in the list, by changing currentID
            var apt = this.appointments()[index % this.appointments().length];
            this.currentID(apt.id());
        }
    };

    this.edit = function edit() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);
    
    this.save = function save() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(false);
    }.bind(this);

    this.cancel = function cancel() {

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editMode(false);
    }.bind(this);

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
}
