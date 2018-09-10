/**
 * Dashboard
 *
 * @module activities/dashboard
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import Appointment from '../../models/Appointment';
import AppointmentView from '../../viewmodels/AppointmentView';
import GetMore from '../../models/GetMore';
import MailFolder from '../../models/MailFolder';
import MessageView from '../../models/MessageView';
import PerformanceSummary from '../../models/PerformanceSummary';
import PublicUser from '../../models/PublicUser';
import UpcomingAppointmentsSummary from '../../models/UpcomingAppointmentsSummary';
import UpcomingBookingsSummary from '../../models/UpcomingBookingsSummary';
import UserJobTitle from '../../models/UserJobTitle';
import UserType from '../../enums/UserType';
import bookings from '../../data/bookings';
import ko from 'knockout';
import messaging from '../../data/messaging';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { data as user } from '../../data/userProfile';
import { list as userListings } from '../../data/userListings';
import users from '../../data/users';

const ROUTE_NAME = 'dashboard';

export default class Dashboard extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Your Dashboard';

        // View members
        this.upcomingBookings = new UpcomingBookingsSummary();
        this.upcomingBookings.isLoading = ko.observable(false);
        this.upcomingBookings.isSyncing = ko.observable(false);

        this.upcomingAppointments = new UpcomingAppointmentsSummary();
        this.upcomingAppointments.isLoading = ko.observable(false);
        this.upcomingAppointments.isSyncing = ko.observable(false);

        this.nextAppointmentServiceProfessionalInfo = ko.observable(null);

        this.nextBooking = ko.observable(null);

        this.inbox = new MailFolder({
            topNumber: 4
        });
        this.inbox.isLoading = ko.observable(false);
        this.inbox.isSyncing = ko.observable(false);

        this.performance = new PerformanceSummary();

        this.getMore = new GetMore();

        this.user = user;

        this.getMapUrlFor = (address) => {
            var lat = ko.unwrap(address.latitude);
            var lng = ko.unwrap(address.longitude);
            //var name = ko.unwrap(address.addressName);
            var place = address.singleLine ? address.singleLine() : '';
            return `https://www.google.com/maps/?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&near=${encodeURIComponent(place)}&z=16`;
        };

        // Retrieves a computed that will link to the given named activity adding the current
        // jobTitleID and a mustReturn URL to point this page so its remember the back route
        this.getUrlTo = (name) => {
            // Sample '/client-appointment/' + jobTitleID()
            const prop = ko.pureComputed(() => `/${name}/${this.upcomingAppointments.nextBooking.bookingID}?mustReturn=${encodeURIComponent('/dashboard/')}&returnText=Dashboard`);
            return prop;
        };
    }

    show(state) {
        super.show(state);

        // Update data
        setSomeTestingData(this);
        if (user.isServiceProfessional()) {
            this.syncUpcomingBookings();
        }
        if (user.isClient()) {
            this.syncUpcomingAppointments();
        }
        this.syncMessages();
        this.syncGetMore();
    }

    syncMessages() {
        if (this.inbox.messages().length) {
            this.inbox.isSyncing(true);
        }
        else {
            this.inbox.isLoading(true);
        }

        messaging.getList()
        .then((threads) => {
            this.inbox.messages(threads().map(MessageView.fromThread.bind(null, this.app)));
        })
        .catch(prepareShowErrorFor('Error loading latest messages'))
        .then(() => {
            // Finally
            this.inbox.isLoading(false);
            this.inbox.isSyncing(false);
        });
    }

    syncUpcomingBookings() {
        if (this.upcomingBookings.items().length) {
            this.upcomingBookings.isSyncing(true);
        }
        else {
            this.upcomingBookings.isLoading(true);
        }
        bookings.getUpcomingBookings()
        .then((upcoming) => {
            this.upcomingBookings.model.updateWith(upcoming, true);
            const b = this.upcomingBookings.nextBooking();

            if (b) {
                this.nextBooking(new AppointmentView(Appointment.fromBooking(b)));
            }
            else {
                this.nextBooking(null);
            }

        })
        .catch(prepareShowErrorFor('Error loading upcoming bookings'))
        .then(() => {
            // Finally
            this.upcomingBookings.isLoading(false);
            this.upcomingBookings.isSyncing(false);
        });
    }

    syncUpcomingAppointments() {
        if (this.upcomingAppointments.items().length) {
            this.upcomingAppointments.isSyncing(true);
        }
        else {
            this.upcomingAppointments.isLoading(true);
        }
        bookings.getUpcomingAppointments()
        .then((upcoming) => {
            this.upcomingAppointments.model.updateWith(upcoming, true);
            if (upcoming.nextBooking) {
                return getUserData(upcoming.nextBooking.serviceProfessionalUserID, upcoming.nextBooking.jobTitleID);
            }
            return null;
        })
        .then((user) => {
            this.nextAppointmentServiceProfessionalInfo(user);
        })
        .catch(prepareShowErrorFor('Error loading upcoming appointments'))
        .then(() => {
            // Finally
            this.upcomingAppointments.isLoading(false);
            this.upcomingAppointments.isSyncing(false);
        });
    }

    syncGetMore() {
        // Professional only alerts/to-dos
        if (user.isServiceProfessional()) {
            // Check the 'profile' alert based on listings status
            const checkStatus = (list) => {
                var yep = list.some((listing) => {
                    if (listing.statusID !== UserJobTitle.status.on)
                        return true;
                });
                this.getMore.profile(!!yep);
            };
            this.subscribeTo(userListings.onData, checkStatus);
            this.subscribeTo(userListings.onDataError, prepareShowErrorFor('Error loading listing status'));
        }
    }
}

activities.register(ROUTE_NAME, Dashboard);

// Utils
/**
 * Generates a function to display an error message given a preset title
 * and a JIT error object/message
 * @param {string} title
 * @returns {function<string,void>}
 */
function prepareShowErrorFor(title) {
    return (err) => {
        showError({
            title: title,
            error: err
        });
    };
}
/**
 * Load and return a public user data model
 * @param {number} userID
 * @param {number} jobTitleID
 * @returns {Promise<PublicUser>}
 */
function getUserData(userID, jobTitleID) {
    return users.getUser(userID)
    .then((info) => {
        info.selectedJobTitleID = jobTitleID;
        return new PublicUser(info);
    });
}
/// TESTING DATA
function setSomeTestingData(that) {
    //that.performance.earnings.currentAmount(2400);
    //that.performance.earnings.nextAmount(6200.54);
    //that.performance.timeBooked.percent(0.93);

    var moreData = {};
    if (that.user.isServiceProfessional()) {
        moreData = {
            availability: false,
            payments: false,
            profile: false,
            coop: false
        };
    }
    else {
        moreData = {
            availability: false,
            payments: false,
            profile: false,
            coop: true
        };
    }
    that.getMore.model.updateWith(moreData);
}
