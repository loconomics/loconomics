/**
 * ViewBooking
 *
 * It manages links to booking card given at emails.
 * Because the app has different URLs for client and professional profiles,
 * and sometimes the same URL needs to be provided, this behaves as the common URL
 * for both that redirects to any specific depending on the booking data.
 *
 * @module activities/view-booking
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import bookings from '../../data/bookings';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'view-booking';

export default class ViewBooking extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Booking';
    }

    /**
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments Booking to display
     * {number} segments[0] bookingID
     */
    show(state) {
        super.show(state);

        var bookingID = state.route.segments[0];
        var currentUserID = user.userID();
        bookings.getBooking(bookingID)
        .then((booking) => {
            if (booking.serviceProfessionalUserID() === currentUserID) {
                shell.go('/appointment/' + booking.serviceDateID(), null, true);
            }
            else {
                shell.go('/client-appointment/' + bookingID, null, true);
            }
        })
        .catch((error) => {
            showError({
                title: 'Booking',
                error
            }).then(() => {
                this.app.goDashboard();
            });
        });
    }
}

activities.register(ROUTE_NAME, ViewBooking);
