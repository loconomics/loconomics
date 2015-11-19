/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    Appointment = require('../models/Appointment'),
    ko = require('knockout'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');

require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extend(function AppointmentActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;    
    this.menuItem = 'calendar';
    
    this.$appointmentView = this.$activity.find('#calendarAppointmentView');
    this.$chooseNew = $('#calendarChooseNew');
    
    this.viewModel = new ViewModel(this.app);
    
    // Create default leftAction/backAction settings
    // later used to instantiate a new NavAction that will
    // dynamically change depending on viewModel data.
    var backActionSettings = {
        link: 'calendar/', // Preserve last slash, for later use
        icon: Activity.NavAction.goBack.icon(),
        isTitle: true,
        text: 'Calendar'
    };
    this.navBar = new Activity.NavBar({
        title: '',
        leftAction: new Activity.NavAction(backActionSettings),
        rightAction: Activity.NavAction.goHelpIndex
    });

    // NavBar must update depending on editMode state (to allow cancel and goBack)
    // and appointment date (on read-only, to go back to calendar on current date)
    ko.computed(function() {
        var editMode = this.viewModel.editMode(),
            isNew = this.viewModel.appointmentCardView() && this.viewModel.appointmentCardView().isNew(),
            date = this.viewModel.currentDate();

        if (editMode) {
            // Is cancel action
            
            if (isNew) {
                // Common way of keep a cancel button on navbar
                var cancelLink = this.viewModel.appointmentCardView();
                cancelLink = cancelLink && cancelLink.progress && cancelLink.progress.cancelLink;

                this.convertToCancelAction(this.navBar.leftAction(), cancelLink || this.requestData.cancelLink);
            }
            else {
                // Use the viewmodel cancelation with confirm, so avoid redirects (and all
                // its problems, as redirects to the sub-edition pages -for example, datetimePicker)
                // and avoid reload, just change current state and keeps in read-only mode
                this.navBar.leftAction().model.updateWith({
                    link: null,
                    text: 'cancel',
                    handler: this.viewModel.appointmentCardView().confirmCancel.bind(this)
                });
            }
        }
        else {
            // Is go to calendar/date action
            var defLink = backActionSettings.link,
                defBackText = backActionSettings.text;
            
            var link = date ? defLink + date.toISOString() : defLink;
            var text = date ? moment(date).format('dddd [(]M/D[)]') : defBackText;
            
            this.navBar.leftAction().model.updateWith($.extend({}, backActionSettings, {
                link: link,
                text: text,
                handler: null
            }));
        }

    }, this);

    
    // On changing the current appointment:
    // - Update URL to match the appointment currently showed
    // - Attach handlers to ID and StartTime so we load data for the new
    //   date when it changes (ID changes on create a booking, StartTime on
    //   edition).
    this.registerHandler({
        target: this.viewModel.currentAppointment,
        handler: function (apt) {
            if (!apt)
                return;

            if ((apt.id() === Appointment.specialIds.newBooking ||
                apt.id() === Appointment.specialIds.newEvent) &&
                !apt.__idDateHandlersAttached) {
                apt.__idDateHandlersAttached = true;
                var prevID = apt.id();
                // With explicit subscribe and not a computed because we
                // must avoid the first time execution (creates an infinite loop)
                apt.id.subscribe(function relocateList() {
                    var id = apt.id();
    
                    if (prevID > 0 || id <= 0) return;
                    prevID = id;
                    this.viewModel.setCurrent(null, id)
                    .then(function() {
                        this.viewModel.updateUrl();
                    }.bind(this));
                }.bind(this));
            }
            
        }.bind(this)._delayed(10)
        // IMPORTANT: delayed REQUIRED to avoid triple loading (activity.show) on first load triggered by a click event.
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    Activity.prototype.show.call(this, options);
    
    // Prepare cancelLink, before any attempt of internal URL rewriting
    if (!this.requestData.cancelLink) {
        var referrer = this.app.shell.referrerRoute;
        referrer = referrer && referrer.url;
        // Avoid links to this same page at 'new booking' or 'new event' state
        // to prevent infinite loops
        //referrer && referrer.replace(/\/?appointment\//i, 'calendar/');
        var reg = /\/?appointment\/([^\/]*)\/((\-3)|(\-4))/i;
        if (referrer && reg.test(referrer)) {
            referrer.replace(reg, '/appointment/$1/');
        }
        
        this.requestData.cancelLink = referrer;
    }
    
    var s1 = options && options.route && options.route.segments[0],
        s2 = options && options.route && options.route.segments[1],
        s3 = options && options.route && options.route.segments[2],
        date,
        datetime,
        id,
        type;

    var isNumber = /^\-?\d+$/;
    if (isNumber.test(s1)) {
        // first parameter is an ID
        id = s1 |0;
        type = s2;
    }
    else {
        date = getDateWithoutTime(s1);
        datetime = s1 && new Date(s1) || date;
        id = s2 |0;
        type = s3;
    }
    
    var setupCard = function() {
        // The card component needs to be updated on load
        // with any option passed to the activity since the component
        // is able to to interact with other activities it has requested
        // (to request information edition)
        var cardApi = this.viewModel.appointmentCardView();
        if (cardApi) {
            // Preset the startTime to the one given by the requestData URL parameters
            // when not in an existent appointment, just because:
            // - On a new booking we can preset the date in the 'select date-time' step
            // - On a new event we can preset the date and time in the card
            // - On the other special cards, its allows to pass the datetime to the links
            //   for creation of a new booking/event.
            if (this.viewModel.appointmentCardView().currentID() <= 0) {
                this.viewModel.appointmentCardView().item().startTime(datetime);
            }

            cardApi.passIn(this.requestData);
        }
        else {
            // The first time may happen that the binding is not ready, no cardApi available
            // but we need it, attempt again in short so card is ready:
            setTimeout(setupCard, 80);
        }
    }.bind(this);

    this.viewModel.setCurrent(date, id, type)
    .then(setupCard);
};

var Appointment = require('../models/Appointment');

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
    this.app = app;
    this.currentDate = ko.observable(new Date());
    this.currentID = ko.observable(0);
    this.currentIndex = ko.observable(0);
    this.editMode = ko.observable(false);
    this.isLoading = ko.observable(false);
    
    this.dateAvailability = ko.observable();
    this.appointments = ko.pureComputed(function() {
        var dateAvail = this.dateAvailability();
        return dateAvail && dateAvail.appointmentsList() || [];            
    }, this);
    
    // To access the component API we use next observable,
    // updated by the component with its view
    this.appointmentCardView = ko.observable(null);

    var loadingAppointment = new Appointment({
        id: Appointment.specialIds.loading,
        summary: 'Loading...'
    });
    var newEmptyDateAppointment = function newEmptyDateAppointment() {
        return new Appointment({
            id: Appointment.specialIds.emptyDate,
            summary: 'You have nothing scheduled',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newUnavailableAppointment = function newUnavailableAppointment() {
        return new Appointment({
            id: Appointment.specialIds.unavailable,
            summary: 'You`re unavailable all day',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newFreeAppointment = function newFreeAppointment() {
        return new Appointment({
            id: Appointment.specialIds.free,
            summary: 'Free',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newEventAppointment = function newEventAppointment() {
        return new Appointment({
            id: Appointment.specialIds.newEvent,
            summary: 'New event...',
            sourceEvent: new CalendarEvent()
        });
    };
    var newBookingAppointment = function newBookingAppointment() {
        return new Appointment({
            id: Appointment.specialIds.newBooking,
            summary: 'New booking...',
            sourceEvent: new CalendarEvent(),
            sourceBooking: new Booking()
        });
    };
    
    this.currentAppointment = ko.observable(loadingAppointment);

    this.updateUrl = function updateUrl() {
        // Update URL to match the appointment ID and
        // track it state
        // Get ID from URL, to avoid do anything if the same.
        var apt = this.currentAppointment(),
            aptId = apt.id(),
            found = /appointment\/([^\/]+)\/(\-?\d+)/i.exec(window.location),
            urlId = found && found[2] |0,
            urlDate = found && found[1],
            curDateStr = getDateWithoutTime(apt.startTime()).toISOString();

        if (!found ||
            urlId !== aptId.toString() ||
            urlDate !== curDateStr) {
            
            var url = 'appointment/' + curDateStr + '/' + aptId;

            // If was an incomplete URL, just replace current state
            if (urlId === '')
                this.app.shell.replaceState(null, null, url);
            else
                this.app.shell.pushState(null, null, url);
        }
    };

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
            this.setCurrent(prevDate)
            .then(function() {
                this.updateUrl();
            }.bind(this));
        }
        else {
            // Go previous item in the list, by changing currentID
            index = index % this.appointments().length;
            var apt = this.appointments()[index];
            this.currentIndex(index);
            this.currentID(apt.id());
            this.currentAppointment(apt);
            this.updateUrl();
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
            this.setCurrent(nextDate)
            .then(function() {
                this.updateUrl();
            }.bind(this));
        }
        else {
            // Go next item in the list, by changing currentID
            index = index % this.appointments().length;
            var apt = this.appointments()[index];
            this.currentIndex(index);
            this.currentID(apt.id());
            this.currentAppointment(apt);
            this.updateUrl();
            // Complete load-double check: this.setCurrent(apt.startTime(), apt.id());
        }
    };

    /**
        Changing the current viewed data by date and id
    **/

    this.getSpecialItem = function (id) {
        switch (id) {
            default:
            //case -1:
                return newEmptyDateAppointment();
            case Appointment.specialIds.free:
                return newFreeAppointment();
            case Appointment.specialIds.newEvent:
                return newEventAppointment();
            case Appointment.specialIds.newBooking:
                return newBookingAppointment();
            case Appointment.specialIds.loading:
                return loadingAppointment;
            case Appointment.specialIds.unavailable:
                return newUnavailableAppointment();
        }
    };
    this.setItemFromCurrentList = function (id) {
        /*jshint maxdepth:6,maxcomplexity:8*/
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
            index = -1;
            // Show as empty or full-unavailable:
            if (this.dateAvailability().workDayMinutes() === 0)
                item = newUnavailableAppointment();
            else
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
    
    var _setCurrent = function setCurrent(date, id, type) {
        //jshint maxcomplexity:8
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

                var ids = {};
                if (type === 'booking')
                    ids.bookingID = id;
                else
                    ids.calendarEventID = id;
                
                return app.model.calendar.getAppointment(ids)
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
            return app.model.calendar.getDateAvailability(date)
            .then(function (dateAvail) {
                this.isLoading(false);
                this.dateAvailability(dateAvail);
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
    this.setCurrent = function setCurrent(date, id, type) {
        // NOTE: Do nothing if is already in loading process
        // TODO: review if is better to cancel current and continue or
        // just the current queue for when it's finish.
        // If set as 'allow concurrent'
        // the isLoading may be not enough to control the several loadings
        promiseSetCurrent = promiseSetCurrent.then(function() {
            return _setCurrent(date, id, type);
        });
        return promiseSetCurrent;
    };
}
