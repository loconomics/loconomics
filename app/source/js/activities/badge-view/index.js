/**
 * Allows to see the full defails of a badge/assertion, publicly
 *
 * @module activities/badge-view
*/
import '../../kocomponents/badge/viewer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'badge-view';

export default class BadgeViewActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = null;

        this.navBar = Activity.createSubsectionNavBar(null);

        this.title = 'View badge(s)';

        this.assertionURL = ko.observable('');
    }

    /**
      * @param {Object} state
     */
    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;

        /**
         * The URL comes in the first segment
         */
        this.assertionURL(decodeURIComponent(params[0]));
    }
}

activities.register(ROUTE_NAME, BadgeViewActivity);
