/**
 * MyAppointments
 *
 * @module activities/my-appointments
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UpcomingAppointmentsSummary from '../../models/UpcomingAppointmentsSummary';
import UserType from '../../enums/UserType';
import bookings from '../../data/bookings';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'my-appointments';

export default class MyAppointments extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'My appointments';

        this.upcomingAppointments = new UpcomingAppointmentsSummary();
        this.upcomingAppointments.isLoading = ko.observable(false);
        this.upcomingAppointments.isSyncing = ko.observable(false);
        // TODO pastAppointments
        this.pastAppointments = {
            pastAppointments: ko.observable(false),
            count: ko.observable(0)
        };
    }

    show(state) {
        super.show(state);

        this.syncUpcomingAppointments();
    }

    /**
     * Retrieves a computed that will link to the given named activity adding the current
     * jobTitleID and a mustReturn URL to point this page so its remember the back route
     * @param {string} name Activity name or relative path (with trimmed slashes) to build an app URL for
     * @returns {KnockoutComputed<string>}
     */
    getUrlTo(name) {
        return ko.pureComputed(() => `/${name}/${this.upcomingAppointments.nextBooking.bookingID}?mustReturn=my-appointments/&returnText=${encodeURIComponent('My appointments')}`);
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
        })
        .catch((error) => {
            showError({
                title: 'Error loading upcoming appointments',
                error
            });
        })
        .then(() => {
            // Finally
            this.upcomingAppointments.isLoading(false);
            this.upcomingAppointments.isSyncing(false);
        });
    }
}

activities.register(ROUTE_NAME, MyAppointments);
