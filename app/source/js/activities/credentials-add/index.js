/**
 * Shows a professional what external platforms we suggest
 * they list their services on based on the job titles
 * they've already created.
 *
 * @module activities/credentials-add
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'credentials-add';

export default class CredentialsAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSubsectionNavBar(null);
        
        this.jobTitleID = ko.observable();
        
        this.listingTitle = ko.observable();
     
        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
         */
        this.title = ko.pureComputed( () => 'Add ' + this.listingTitle() + ' credentials');
    }

    /**
     * @param {Object} state
     */
    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;

        /**
         * jobTitleID is the first segment in the activity 
         * URL.
         */
        this.jobTitleID(params[0] |0);

        /**
         * listingTitle is the second segment in the activity 
         * URL.
         */
        this.listingTitle(params[1] |0);
    }
}

activities.register(ROUTE_NAME, CredentialsAddActivity);
