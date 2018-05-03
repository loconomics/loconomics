/**
 * Allows a professional to edit an earnings entry.
 *
 * @module activities/listing-categories-edit
 *
 */

import '../../kocomponents/listing/solutions-editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'listing-categories-edit';

export default class ListingCategoriesEditActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar(null);

        /**
         * Creates a placeholder for an "out" parameter to be
         * populated by the component.
        */
        this.jobTitleName = ko.observable('');

        /**
         * Creates a placeholder for the external listing ID
         * to be populated using the show(state) method below.
         */
        this.jobTitleID = ko.observable();
        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
        */
        this.title = ko.pureComputed( () => 'Edit ' + this.jobTitleName() + ' listing categories');

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave();
        };
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        /**
         * ID is the first segment in the activity
         * URL.
         */
        this.jobTitleID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, ListingCategoriesEditActivity);
