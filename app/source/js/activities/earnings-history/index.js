/**
 * Allows a professional to view a history of their earnings.
 *
 * @module activities/earnings-history
 *
 */

import '../../kocomponents/earnings/history';
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

    show(state) {
        super.show(state);
        // Check other examples for some code using 'state'
    }
}

activities.register(ROUTE_NAME, EarningsHistoryActivity);
