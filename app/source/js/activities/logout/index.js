/**
 * Logout: Log outs the user and redirects to index page.
 *
 * @module activities/logout
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import auth from '../../data/auth';
import shell from '../../app.shell';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'logout';

export default class Logout extends Activity {

    static get template() { return ''; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.title = 'Logging out...';
    }

    show(state) {
        super.show(state);

        auth
        .logout()
        .then(() => {
            // Anonymous user again
            var newAnon = user.constructor.newAnonymous();
            user.model.updateWith(newAnon);
            // Go index
            shell.go('/');
        });
    }
}

activities.register(ROUTE_NAME, Logout);
