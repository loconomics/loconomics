/**
 * Allows a client to add a posting.
 *
 * @module activities/posting-add
 *
 */

import '../../kocomponents/posting/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'posting-add';

export default class PostingAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSubsectionNavBar(null);
        this.title = 'Add posting';
        /**
         * Creates a placeholder for the ID
         * to be populated using the show(state) method below.
         */
        this.userPostingID = ko.observable(null);

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
         * userPostingID as the first segment in the activity URL,
         * allowing to preset that value in the new earnings entry.
         */
        this.userPostingID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, PostingAddActivity);
