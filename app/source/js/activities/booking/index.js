/**
 * Booking activity: It allows a client to book a serviceProfessional
 *
 * @module activities/booking
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import NewClientBookingCardVM from '../../viewmodels/NewClientBookingCardVM';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'booking';

export default class Booking extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // Anyone can access this, as we provide login and signup options integrated here
        this.accessLevel = null;
        this.navBar = Activity.createSubsectionNavBar('Booking', {
            helpLink: '/help'
        });
        this.title('Booking');

        // Mixim
        NewClientBookingCardVM.call(this, app);

        this.registerHandler({
            target: this.progress.step,
            handler: () => {
                // Trigger load of the specific step
                var load = this[this.progress.currentStep() + 'Load'];
                if (load)
                    load.call(this);
            }
        });

        var labelTpl = ' (Step __step__ of __total__)';
        var title = this.title;
        ko.computed(function() {
            var step = this.step() + 1;
            var total = this.totalSteps();
            var label = 'Booking';
            if (step > 0 && total > 1) {
                label = labelTpl
                .replace('__step__', step)
                .replace('__total__', total);
            }
            title(label);
        }, this.progress);
    }

    /**
     * Set-ups the view based on routing/URL and referrer.
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array} state.route.segments Provides positional routing with
     * {(string|number)} segments[0] serviceProfessionalID
     * {(string|number)} segments[1] jobTitleID
     * @param {Object} state.route.query URL query keyed values
     * @param {string} state.route.query.bookCode
     */
    show(state) {
        super.show(state);

        var referrer = this.app.shell.referrerRoute;
        referrer = referrer && referrer.url;
        // Avoid links to this same page
        // TODO: This hardcoded URL in RegEx should use the ROUTE_NAME constant
        var reg = /\/?booking/i;
        if (!referrer || reg.test(referrer)) {
            referrer = '/';
        }
        this.convertToCancelAction(this.navBar.leftAction(), referrer);

        var params = state.route.segments;
        var bookCode = state.route.query.bookCode;

        this.initBooking(params[0] |0, params[1] |0, bookCode);
    }

    hide() {
        super.hide();

        if (!this.isDone())
            this.saveState();
    }

    ///
    /// Methods that initialize/load each step, given the name of registered steps
    /// and sufix 'Load'

    servicesLoad() {
        this.loadServices();
    }

    selectLocationLoad() {
        this.loadServiceAddresses();
    }

    selectTimesLoad() {}

    selectTimeLoad() {}

    paymentLoad() {}

    confirmLoad() {}
}

activities.register(ROUTE_NAME, Booking);
