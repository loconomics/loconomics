/**
 * Upgrade.
 * Offer payment plans options to user.
 *
 * @module activities/upgrade
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'upgrade';

export default class Upgrade extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = new Activity.NavBar({
            title: null,
            leftAction: Activity.NavAction.menuIn
            // NOTE: Removed as of #726 until a new menu for it is implemented as of #191 child issues.
            //rightAction: Activity.NavAction.menuNewItem
        });
        this.title('Become a member of Loconomics');
    }
}

activities.register(ROUTE_NAME, Upgrade);
