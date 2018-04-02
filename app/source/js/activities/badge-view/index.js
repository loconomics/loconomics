/**
 * Allows the user to add an external listing.
 *
 * @module activities/badge-view
*/
import '../../kocomponents/badge/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'badge-view';

export default class BadgeViewActivity extends Activity {

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
         * Creates a placeholder for the jobTitle ID to be
         * populated using the show(state) method below.
        */
        this.jobTitleID = ko.observable();

        /**
         * Creates a placeholder for the jobTitle ID to be
         * populated using the show(state) method below.
        */
        this.listingTitle = ko.observable();

        /**
         * Title uses a pureComputed to ensure the jobTitleName
         * is updated.
        */
        this.title = ko.pureComputed( () => 'Add badge(s) to ' + this.listingTitle() + ' listing');

        /**
         * After data being saved, notice and go back to the
         * job title's listing editor
         */
        this.onSaved = () => {
            app.successSave({
                link: '/listingEditor/' + this.jobTitleID()
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
         * jobTitleID is the first segment in the activity
         * URL
         */
        this.badgeURL(params[0] || -1);

        /**
         * listingTitle is the second segment in the activity
         * URL
         */
        this.listingTitle(params[1] || '');
    }
}

activities.register(ROUTE_NAME, BadgeViewActivity);
