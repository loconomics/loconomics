/**
 * Allows a professional to edit an earnings entry.
 *
 * @module activities/earnings-edit
 *
 */

import '../../kocomponents/earnings/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'earnings-edit';

export default class EarningsEditActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Earnings History', {
            backLink: '/earnings-history'
        });
        /**
         * Creates a placeholder for the external listing ID
         * to be populated using the show(state) method below.
         */
        this.earningsEntryID = ko.observable();
        this.title = 'Edit earnings';

        this.earningsEntryID.subscribe((id) => {
            this.navBar.leftAction().link(`/earnings-view/${id}`);
            this.navBar.leftAction().text('View Earnings');
        });

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave();
        };

        /**
         * After being deleted, notice and go back to earnings
         */
        this.onDeleted = () => {
            app.successSave({
                message: 'Successfully deleted',
                link: '/earnings-history'
            });
        };
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        /**
         * ID is the first segment in the activity
         * URL.
         */
        this.earningsEntryID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, EarningsEditActivity);
