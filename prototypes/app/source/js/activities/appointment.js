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
    
    // Just update URL to match the appointment currently showed
//    this.registerHandler({
//        target: this.viewModel.currentAppointment,
//        handler: function (apt) {
//            
//            if (!apt)
//                return;
//            
//            // Update URL to match the appointment ID and
//            // track it state
//            // Get ID from URL, to avoid do anything if the same.
//            var aptId = apt.id(),
//                found = /appointment\/([^\/]+)\/(\-?\d+)/i.exec(window.location),
//                urlId = found && found[2] |0,
//                urlDate = found && found[1],
//                curDateStr = getDateWithoutTime(this.viewModel.currentDate()).toISOString();
//
//            if (!found ||
//                urlId !== aptId.toString() ||
//                urlDate !== curDateStr) {
//                
//                // TODO save a useful state
//                // Not for now, is failing, but something based on:
//                /*
//                var viewstate = {
//                    appointment: apt.model.toPlainObject(true)
//                };
//                */
//
//                // If was a root URL, no ID, just replace current state
//                if (urlId === '')
//                    this.app.shell.history.replaceState(null, null, 'appointment/' + curDateStr + '/' + aptId);
//                else
//                    this.app.shell.history.pushState(null, null, 'appointment/' + curDateStr + '/' + aptId);
//            }
//        }.bind(this)
//    });
    
    var ModelVersion = require('../utils/ModelVersion');

    var app = this.app;
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
    
    var s1 = options && options.route && options.route.segments[0],
        s2 = options && options.route && options.route.segments[1],
        date,
        id;

    if (/^\-?\d+$/.test(s1)) {
        // first parameter is an ID
        id = s1 |0;
    }
    else {
        date = getDateWithoutTime(s1);
        id = s2 |0;
    }
    console.log('apt show', date, id);
    this.viewModel.setCurrent(date, id)
    .then(function() {
        // If the request includes an appointment plain object, that's an
        // in-editing appointment so put it in place (to restore a previous edition)
        if (this.requestData.appointment) {
            this.viewModel.editMode(true);
            this.viewModel.editedAppointment().model.updateWith(this.requestData.appointment);
        }
        else {
            // On any other case, and to prevent bad editMode on entering, 
            // do a discard taht sets editMode off
            this.viewModel.cancel();
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
    }.bind(this));
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
    /*jshint maxstatements: 40 */

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
            summary: 'There are no appointments on this date',
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

    this.currentAppointment = ko.observable(loadingAppointment);

    this.goPrevious = function goPrevious() {
        if (this.editMode()) return;

        var index = this.currentIndex() - 1;

        if (index < 0) {
            // Go previous date
            var m = moment(this.currentDate());
            if (!m.isValid()) {
                m = moment(new Date());
            }
            var prevDate = m.subtract(1, 'days').toDate();
            this.setCurrent(prevDate);
        }
        else {
            // Go previous item in the list, by changing currentID
            index = index % this.appointments().length;
            var apt = this.appointments()[index];
            this.currentIndex(index);
            this.currentID(apt.id());
            this.currentAppointment(apt);
            // Complete load-double check: this.setCurrent(apt.startTime(), apt.id());
        }
    };

    this.goNext = function goNext() {
        if (this.editMode()) return;
        var index = this.currentIndex() + 1;

        if (index >= this.appointments().length) {
            // Go next date
            var m = moment(this.currentDate());
            if (!m.isValid()) {
                m = moment(new Date());
            }
            var nextDate = m.add(1, 'days').toDate();
            this.setCurrent(nextDate);
        }
        else {
            // Go next item in the list, by changing currentID
            index = index % this.appointments().length;
            var apt = this.appointments()[index];
            this.currentIndex(index);
            this.currentID(apt.id());
            this.currentAppointment(apt);
            // Complete load-double check: this.setCurrent(apt.startTime(), apt.id());
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

    /**
        Changing the current viewed data by date and id
    **/

    this.setList = function (list) {
        list = list || [];
        this.appointments(list);
    };
    this.getSpecialItem = function (id) {
        switch (id) {
            default:
            //case -1:
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
        }
    };
    this.setItemFromCurrentList = function (id) {
        console.log('setItemFromCurrentList', id);
        /*jshint maxdepth:6*/
        var list = this.appointments(),
            index,
            item;

        // First, respect special IDs, except the 'no appts':
        if (id < -1) {
            item = this.getSpecialItem(id);
            index = -1;
        }
        else if (list.length === 0) {
            // No item ID, empty list:
            console.log('id', id);
            index = -1;
            item = newEmptyDateAppointment();
        }
        else {
            // Start getting the first item in the list
            item = list[0];
            index = 0;
            
            // With any ID value
            if (id) {
                // Search the ID
                if (id > 0) {
                    // search item in cached list
                    var found = findAppointmentInList(list, id);

                    if (found.item) {
                        item = found.item;
                        index = found.index;
                    }
                    // Else, the first item will be used
                }
                else {
                    item = this.getSpecialItem(id);
                    index = -1;
                }
            }   
        }

        this.currentID(item.id());
        this.currentIndex(index);
        this.currentAppointment(item);
    };
    
    var _setCurrent = function setCurrent(date, id) {    
        // IMPORTANT: the date to use must be ever
        // a new object rather than the referenced one to
        // avoid some edge cases where the same object is mutated
        // and comparisions can fail. 
        // getDateWithoutTime ensure to create a new instance ever.
        date = date && getDateWithoutTime(date) || null;
        if (date)
            this.currentDate(date);
        
        if (!date) {
            if (id > 0) {
                // remote search for id
                this.isLoading(true);

                var notFound = function notFound() {
                    this.isLoading(false);
                    return _setCurrent(new Date());
                }.bind(this);

                return app.model.appointments.getAppointment(id)
                .then(function (item) {
                    if (item) {
                        // Force a load for the item date.
                        var itDate = getDateWithoutTime(item.startTime());
                        this.isLoading(false);
                        return _setCurrent(itDate, item.id());
                    }
                    else {
                        return notFound();
                    }
                }.bind(this))
                .catch(notFound);
            }
            else if (id < 0) {
                // Special IDs
                return _setCurrent(new Date(), id);
            }
            else {
                // No date, no ID, load today
                return _setCurrent(new Date());
            }
        }
        else {
            this.isLoading(true);
            return app.model.appointments.getAppointmentsByDate(date)
            .then(function (list) {
                this.isLoading(false);
                this.setList(list);
                this.setItemFromCurrentList(id);
            }.bind(this))
            .catch(function(err) {

                this.isLoading(false);

                var msg = 'Error loading calendar events.';
                app.modals.showError({
                    title: msg,
                    error: err && err.error || err
                });

            }.bind(this));
        }
    }.bind(this);

    var promiseSetCurrent = Promise.resolve();
    this.setCurrent = function setCurrent(date, id) {
        console.log('setCurrent', date, id);
        // NOTE: Do nothing if is already in loading process
        // TODO: review if is better to cancel current and continue or
        // must be queued for when it's finish. If set as 'allow concurrent'
        // the isLoading may be not enough to control the several loadings
        promiseSetCurrent = promiseSetCurrent.then(function() {
            console.log('__setCurrent', date, id);
            return _setCurrent(date, id);
        });
        return promiseSetCurrent;
    };
}

