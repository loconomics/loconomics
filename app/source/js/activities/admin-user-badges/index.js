/**
 * Let's administrators to manage assigned user badges.
 *
 * @module activities/admin-user-badges
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'admin-user-badges';

export default class AdminUserBadgesActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.admin;
        this.navBar = Activity.createSubsectionNavBar('Admin', {
            backLink: '/admin'
        });
        this.title = 'Manage user badges';
    }

    /**
     * @param {Object} state
     */
    show(state) {
        super.show(state);
        // Check other examples for some code using 'state'
    }
}

activities.register(ROUTE_NAME, AdminUserBadgesActivity);
