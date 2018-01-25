/**
 * Allows a professional to edit their external listing's 
 * information.
 * @module activities/external-listing-edit
 *
 */
import '../../kocomponents/external-listing/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'external-listing-edit';

export default class ExternalListingEditActivity extends Activity {

    static get template() { return template; }

    /**
     * REMOVEME: No need to document standard behavior and parameters for the
     * activity, since usually is just copy&paste of base Activity class and
     * is redundant. But document with a jsdoc comment like this if some special
     * behavior is worth note it.
     * Use this constructor to set instance values for inherit and required
     * members and create new members (usually observables and computed) usually
     * needed at the template; methods needed at the template can be created
     * as class methods or defined at the constructor if there is need to access
     * some private/closure values or problems with the execution context ('bind')
     * @param {jQuery} $activity
     * @param {App} app
     */
    constructor($activity, app) {
        // REMOVEME: This set of parameters is being reviewed and can change/remove
        // in a future (specially the 'app' global instance, replacing by modules
        // explicitly imported for specific tasks).
        super($activity, app);

        // FIXME: REQUIRED: Define which users can access this activity filtering by
        // user type. Assign any valid UserType value.
        // You can set the value 'null' to allow any
        this.accessLevel = UserType.serviceProfessional;
        // FIXME: REQUIRED: Define the kind of activity navbar used and values
        // For now, next set-up is the usual for first-level activities (like
        // home, dashboard, cms, ...). Use Activity.createSubsectionNavBar
        // and accepted values for activities that are behind another in the
        // navigation hierarchy (check Activity class documentation)
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        // FIXME: REQUIRED: Define the activity title, used at window/tab
        // and top title in the template
        // This value can be a string (then is a constant value for all the life
        // of the activity), an observable (dynamically changed depending
        // on the route or user interaction), a pureComputed (dynamically
        // changed depending on other activity observables --usually this is
        // recommended over an observable since it keeps all possible values
        // in one place)
        this.title = 'Edit your ' + '' + ' listing';
        this.externalListingID = ko.observable();
    }

    /**
     * REMOVEME: If there is no parameters/state accepted by this activity,
     * there is no need to document here the standard behavior and parameters for the
     * show method, since usually is just copy&paste of base method and
     * is redundant. But document with a jsdoc comment like this if some special
     * behavior is worth note it and when specific state properties and values
     * are expected.
     * Replace this method only if need to execute some code when the activity
     * is being displayed and to read/analyze incoming state parameters (routing
     * internal to the activity, query-string parameters, communication between
     * activities through state properties).
     * Remove all this 'show' code if you don't need to do anything here
     * @param {Object} state
     */
    show(state) {
        super.show(state);
        // Check other examples for some code using 'state'
        var params = state.route && state.route.segments;
        this.externalListingID(params[0] || 0);
    }
}

activities.register(ROUTE_NAME, ExternalListingEditActivity);
