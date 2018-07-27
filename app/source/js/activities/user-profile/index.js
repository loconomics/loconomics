/**
 * User Profile activity
 *
 * @module activities/user-profile
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'user-profile';

export default class UserProfileActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Profile';

        this.isOrganization = user.isOrganization;
    }
}

activities.register(ROUTE_NAME, UserProfileActivity);
