/**
 * Earnings activity that enables professionals to view 
 * a summary of their total earnings in and outside of 
 * Loconomics.
 *
 * @module activities/_examples/a-basic-activity
 *
 */

import '../../kocomponents/earnings/summary';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'earnings';

export default class EarningsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        this.title = 'Earnings';
    }
}

activities.register(ROUTE_NAME, EarningsActivity);
