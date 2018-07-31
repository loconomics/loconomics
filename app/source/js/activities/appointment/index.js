/**
 * Appointment activity: display, create and edit calendar blocks/events,
 * service professional bookings, and different kind of placeholders matching
 * calendar slots like 'free time' or 'advance time'.
 * TODO: Needs and important refactoring as components since is responsible
 * of too much, combining different type of data, and ensuring that accessibility
 * guidelines are meet in the edition mode (that is disabled right now because
 * of that)
 *
 * @module activities/appointment
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../components/DatePicker';
import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import Appointment from '../../models/Appointment';
import { events as AppointmentEvent } from '../../kocomponents/legacy/appointment-card';
import Booking from '../../models/Booking';
import CalendarEvent from '../../models/CalendarEvent';
import Listener from '../../utils/EventEmitterListener';
import UserType from '../../enums/UserType';
import calendar from '../../data/calendar';
import getDateWithoutTime from '../../utils/getDateWithoutTime';
import ko from 'knockout';
import moment from 'moment';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'appointment';

export default class AppointmentActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = new Activity.NavBar({
            title: '',
            leftAction: new Activity.NavAction(backActionSettings),
            rightAction: Activity.NavAction.goHelpIndex
        });

        // TODO: Refactor ViewModel as Activity members, spliting to components the most
        ViewModelMixim.call(this);

        this.menuItem = 'calendar';
        this.$appointmentView = $activity.find('#calendarAppointmentView');
        this.$chooseNew = $('#calendarChooseNew');
        this.appointmentListeners = [];

        // Create default leftAction/backAction settings
        // later used to instantiate a new NavAction that will
        // dynamically change depending on viewModel data.
        var backActionSettings = {
            link: this.defaultBackToCalendarUrl,
            icon: Activity.NavAction.goBack.icon(),
            isTitle: true,
            text: 'Calendar'
        };
        this.cardTitle = ko.pureComputed(() => {
            const t = this.appointmentCardView() &&
                this.appointmentCardView().item() &&
                this.appointmentCardView().item().summary() ||
                'Appointment';
            return t;
        });
        this.title = ko.pureComputed(() => {
            const t =
                this.currentID() == this.specialAppointmentIds.newBooking ?
                    'Add a new booking' :
                    this.currentID() == this.specialAppointmentIds.newEvent ?
                    'Add a calendar block' :
                    !this.isNewCard() ?
                    this.cardTitle() :
                    'Add';
            return t;
        });

        this.__connectNavBarMode(backActionSettings);
        this.__connectHandlers();
    }

    __connectNavBarMode(backActionSettings) {
        // NavBar must update depending on editMode state (to allow cancel and goBack)
        // and appointment date (on read-only, to go back to calendar on current date)
        ko.computed(() => {
            var editMode = this.editMode();
            var isNew = this.appointmentCardView() && this.appointmentCardView().isNew();

            if (editMode) {
                // Is cancel action

                if (isNew) {
                    // Common way of keep a cancel button on navbar
                    var cancelLink = this.appointmentCardView();
                    cancelLink = cancelLink && cancelLink.progress && cancelLink.progress.cancelLink;

                    this.convertToCancelAction(this.navBar.leftAction(), cancelLink || this.requestData.cancelLink);
                }
                else {
                    // Use the cancelation with confirm, so avoid redirects (and all
                    // its problems, as redirects to the sub-edition pages -for example, datetimePicker)
                    // and avoid reload, just change current state and keeps in read-only mode
                    this.navBar.leftAction().model.updateWith({
                        link: null,
                        text: 'cancel',
                        handler: this.appointmentCardView().confirmCancel.bind(this)
                    });
                }
            }
            else {
                // Is go to calendar/date action
                var defBackText = backActionSettings.text;

                var link = this.backToCalendarUrl();
                var text = this.formattedCurrentDate() || defBackText;

                this.navBar.leftAction().model.updateWith($.extend({}, backActionSettings, {
                    link: link,
                    text: text,
                    handler: null
                }));
            }
        });
    }

    __connectHandlers() {
        // On changing the current appointment:
        // - Update URL to match the appointment currently showed
        // - Attach handlers to ID and StartTime so we load data for the new
        //   date when it changes (ID changes on create a booking, StartTime on
        //   edition).
        this.registerHandler({
            target: this.currentAppointment,
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
                        this.setCurrent(null, id)
                        .then(function() {
                            this.updateUrl();
                        }.bind(this));
                    }.bind(this));
                }

            }.bind(this)._delayed(10)
            // IMPORTANT: delayed REQUIRED to avoid triple loading (activity.show) on first load triggered by a click event.
        });

        this.registerHandler({
            target: this.currentAppointment,
            handler: function() { this.registerAppointmentListeners(); }.bind(this)
        });

        this.registerHandler({
            target: this.appointmentCardView,
            handler: function() { this.registerAppointmentListeners(); }.bind(this)
        });
    }

    registerAppointmentListeners() {
        var listeners = [];
        var cardView = this.appointmentCardView();
        var app = this.app;

        this.disposeAppointmentListeners();

        if(cardView) {
            listeners.push(new Listener(cardView, AppointmentEvent.confirmed, (appointment) => {
                // Go to the confirmed card at the date that was confirmed
                this.setCurrent(null, appointment.sourceBooking().bookingID(), 'booking');
            }));

            listeners.push(new Listener(cardView, AppointmentEvent.declined, (appointment) => {
                // Go to the calendar day of the declined booking at the current appointment day
                app.shell.go('calendar/' + appointment.startTime().toISOString());
            }));

            listeners.push(new Listener(cardView, AppointmentEvent.cancelled, (appointment) => {
                // Go to the calendar day of the cancelled booking at the appointment day
                app.shell.go('calendar/' + appointment.startTime().toISOString());
            }));

            this.appointmentListeners = listeners;
        }
    }

    disposeAppointmentListeners() {
        this.appointmentListeners.forEach(function(listener) {
            listener.dispose();
        });
    }

    /**
     * Set-up based on state parameters and routing
     * @param {Object} state
     * @param {Appointment} state.appointment Data to keep editing
     * @param {Object} state.route
     * @param {Array} state.route.segments Parameters encoded in the URL path
     * for a datetime, appointment id and type of appointment (see __parseRoutingParameters)
     */
    show(state) {
        super.show(state);

        if (state && state.appointment) {
            // We are editing an appointment, so avoid the scroll and that
            // way the user don't forget the focus on the field was editing
            this.resetScroll = false;
        }
        else {
            // Wanted on any other case
            this.resetScroll = true;
        }

        // Prepare cancelLink, before any attempt of internal URL rewriting
        if (!state.cancelLink) {
            var referrer = this.app.shell.referrerRoute;
            referrer = referrer && referrer.url;
            // Avoid links to this same page at 'new booking' or 'new event' state
            // to prevent infinite loops
            //referrer && referrer.replace(/\/?appointment\//i, 'calendar/');
            // TODO: reference to the route name should depend on constant ROUTE_NAME
            var reg = /\/?appointment\/([^/]*)\/((-3)|(-4))/i;
            if (referrer && reg.test(referrer)) {
                referrer = referrer.replace(reg, '/appointment/$1/');
            }

            state.cancelLink = referrer;
        }

        const { date, datetime, id, type } = this.__parseRoutingParameters(state.route);

        var setupCard = () => {
            // The card component needs to be updated on load
            // with any option passed to the activity since the component
            // is able to to interact with other activities it has requested
            // (to request information edition)
            var cardApi = this.appointmentCardView();
            if (cardApi) {
                // Preset the startTime to the one given by the route URL parameters
                // when not in an existent appointment, just because:
                // - On a new booking we can preset the date in the 'select date-time' step
                // - On a new event we can preset the date and time in the card
                // - On the other special cards, its allows to pass the datetime to the links
                //   for creation of a new booking/event.
                if (this.appointmentCardView().currentID() <= 0) {
                    this.appointmentCardView().item().startTime(datetime);
                }

                cardApi.passIn(state);
            }
            else {
                // The first time may happen that the binding is not ready, no cardApi available
                // but we need it, attempt again in short so card is ready:
                setTimeout(setupCard, 80);
            }
        };

        this.setCurrent(date, id, type)
        .then(setupCard);
    }

    hide() {
        super.hide();
        this.disposeAppointmentListeners();
    }

    /**
     * @param {Object} route Route information passed in at 'show'
     * @returns {Object} Named parameter values for { date, datetime, id, type }
     */
    __parseRoutingParameters(route) {
        var s1 = route.segments[0];
        var s2 = route.segments[1];
        var s3 = route.segments[2];
        var date;
        var datetime;
        var id;
        var type;

        var isNumber = /^-?\d+$/;
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

        return {
            date,
            datetime,
            id,
            type
        };
    }
}

activities.register(ROUTE_NAME, AppointmentActivity);

function findAppointmentInList(list, id) {
    var found = null;
    var index = -1;
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

// Mix with the Activity instance so includes all this members and
// simplify Quick460 until a depth refactor happens
function ViewModelMixim() {
    /* eslint max-statements:"off" */
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

    this.specialAppointmentIds = Appointment.specialIds;
    this.isNewCard = ko.pureComputed(function() {
        var id = this.currentID();
        return id === Appointment.specialIds.newBooking || id === Appointment.specialIds.newEvent;
    }, this);

    this.formattedCurrentDate = ko.pureComputed(function() {
        var date = this.currentDate();
        return date ? moment(date).format('dddd [(]M/D[)]') : '';
    }, this);

    // Preserve last slash, for later use
    this.defaultBackToCalendarUrl = 'calendar/';
    this.backToCalendarUrl = ko.pureComputed(function() {
        var date = this.currentDate();
        return date ? this.defaultBackToCalendarUrl + date.toISOString() : this.defaultBackToCalendarUrl;
    }, this);

    // To access the component API we use next observable,
    // updated by the component with its view
    this.appointmentCardView = ko.observable(null);

    this.isEditButtonVisible = ko.pureComputed(function() {
        var a = this.appointmentCardView();
        return this.currentID() > 0 && a && !a.isLocked() && !a.editMode();
    }, this);

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
        var apt = this.currentAppointment();
        var aptId = apt.id();
        var found = /appointment\/([^/]+)\/(-?\d+)/i.exec(window.location);
        var urlId = found && found[2] |0;
        var urlDate = found && found[1];
        var curDateStr = getDateWithoutTime(apt.startTime()).toISOString();

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
        /* eslint maxdepth:"off", complexity:"off" */
        var list = this.appointments();
        var index;
        var item;

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

                return calendar.getAppointment(ids)
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
            return calendar.getDateAvailability(date)
            .then(function (dateAvail) {
                this.isLoading(false);
                this.dateAvailability(dateAvail);
                this.setItemFromCurrentList(id);
            }.bind(this))
            .catch(function(err) {

                this.isLoading(false);

                var msg = 'Error loading calendar events.';
                showError({
                    title: msg,
                    error: err
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
