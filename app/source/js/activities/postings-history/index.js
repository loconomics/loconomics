/**
 * Allows a professional to view a history of their earnings.
 *
 * @module activities/posting-history
 *
 */

import '../../kocomponents/posting/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'posting-history';

export default class PostingHistoryActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSubsectionNavBar(null);
        this.title = 'Posting History';
    }
}

activities.register(ROUTE_NAME, PostingHistoryActivity);
