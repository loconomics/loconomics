/**
 * Signup
 *
 * @module activities/signup
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import SignupVM from '../../viewmodels/Signup';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'signup';

export default class Signup extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.anonymous;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Welcome to Loconomics';

        // Component API entry point: expects SignupVM
        this.signup = ko.observable();
        this.signup.subscribe(() => this.reset);
        // A static utility (currently only used to conditionally show/hide DownloadApp links)
        this.inApp = ko.observable(!!window.cordova);

        this.redirect = () => app.goDashboard();
    }

    /**
     * Focus first wrong field handler for the signup error event
     * (event-handler set-up in markup)
     *
     * TODO: Errors management needs update because this code is actually
     * not working as expected, because the displaying of an error modal
     * changes the focus (at opening or at user action to close it); so,
     * this does the work but the focus gets replaced before user can
     * actually see it.
     */
    focusWrongField() {
        // Focus first field with error
        var $el = this.$activity.find('.form-group.has-error:first').find('input');
        // Using timer because trying synchronously will not work on some cases
        setTimeout(() => $el.focus(), 100);
    }

    reset() {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.reset();
        }
    }

    /**
     * Allows to set some of the properties
     * of the Signup component with values from incoming parameters
     * @param {object} options
     * @param {string} options.email
     * @param {string} options.confirmationCode
     */
    setupWith(options) {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.email(options.email || undefined);
            signup.emailIsLocked(!!options.email);
            signup.confirmationCode(options.confirmationCode || undefined);
        }
    }

    show(state) {
        super.show(state);

        this.reset();
        const q = state.route.query;
        this.setupWith({
            email: q.email,
            confirmationCode: q.confirmationCode
        });
    }
}

activities.register(ROUTE_NAME, Signup);
