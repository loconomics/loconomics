/**
 * Allows a professional to edit their external listing's
 * information.
 *
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
         * Creates a placeholder for the external listing ID to
         * be populated using the show(state) method below.
         */
        this.externalListingID = ko.observable();

        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
         */
        this.title = ko.pureComputed( () => 'Edit ' + this.platformName() + ' listing');

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave();
        };

        /**
         * After listing being deleted, notice and go back to listing
         */
        this.onDeleted = () => {
            app.successSave({
                message: 'Successfully deleted',
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
         * externalListingID is the first segment in the activity
         * URL
         */
        this.externalListingID(params[0] || 0);
    }
}

activities.register(ROUTE_NAME, ExternalListingEditActivity);
