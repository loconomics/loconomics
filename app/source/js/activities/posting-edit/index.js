/**
 * Allows a professional to edit an earnings entry.
 *
 * @module activities/posting-edit
 *
 */

import '../../kocomponents/posting/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'posting-edit';

export default class PostingEditActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSubsectionNavBar(null);
        /**
         * Creates a placeholder for the external listing ID
         * to be populated using the show(state) method below.
         */
        this.earningsEntryID = ko.observable();
        this.title = 'Edit earnings';

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

activities.register(ROUTE_NAME, PostingEditActivity);
