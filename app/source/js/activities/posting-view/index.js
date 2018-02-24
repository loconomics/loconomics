/**
 * Allows a professional to view an earnings entry.
 *
 * @module activities/posting-view
 *
 */
import '../../kocomponents/posting/viewer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'posting-view';

export default class PostingViewActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSubsectionNavBar(null);
        /**
         * Creates a placeholder for the external listing ID
         * to be populated using the show(state) method below.
         */
        this.earningsEntryID = ko.observable();
        this.title = 'View postings';
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        /**
         * earningsEntryID is the first segment in the activity
         * URL.
         */
        this.earningsEntryID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, PostingViewActivity);
