/**
 * Shows a professional what external platforms we suggest 
 * they list their services on based on the job titles 
 * they've already created.
 *
 * @module activities/market-externally
 */

import '../../kocomponents/external-platform/suggestions-list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';
import userProfile from '../../data/userProfile';

const ROUTE_NAME = 'market-externally';

export default class MarketExternallyActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        /*
        * Passes in the current user's ID as an observable.
        */
        this.userID = userProfile.data.userID;
  
        this.title = 'Market yourself outside of Loconomics';
    }
}

activities.register(ROUTE_NAME, MarketExternallyActivity);
