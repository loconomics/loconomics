/**
 * Allows a professional to view a history of their earnings.
 *
 * @module activities/earnings-history
 *
 */

import '../../kocomponents/earnings/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'earnings-history';

export default class EarningsHistoryActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar(null);
        this.title = 'Earnings History';
    }
}

activities.register(ROUTE_NAME, EarningsHistoryActivity);
