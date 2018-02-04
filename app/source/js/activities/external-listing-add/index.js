/**
 * Allows the user to add an external listing.
 *
 * @module activities/external-listing-add
*/
import '../../kocomponents/external-listing/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'external-listing-add';

export default class ExternalListingAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSubsectionNavBar(null);

        /**
         * Creates a placeholder for an "out" parameter to be
         * populated by the component.
        */
        this.platformName = ko.observable('');

        /**
         * Creates a placeholder for the platform ID to be
         * populated using the show(state) method below.
        */
        this.platformID = ko.observable();

        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
        */
        this.title = ko.pureComputed( () => 'Add ' + this.platformName() + ' listing');

        /**
         * After data being saved, notice and go back to listings
         */
        this.onSaved = () => {
            app.successSave({
                link: '/listings'
            });
        };
    }

    /**
      * @param {Object} state
     */
    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;

        /**
         * platformID is the first segment in the activity
         * URL
         */
        this.platformID(params[0] || -1);
    }
}

activities.register(ROUTE_NAME, ExternalListingAddActivity);
