/**
 * Postings activity that lists the active postings a 
 * client has created.
 *
 * @module activities/postings
 *
 */

import '../../kocomponents/posting/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'postings';

export default class PostingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        /**
         * A userID for posting-list component. 
         * @member {KnockoutObservable<integer>}
         */
        this.userID = ko.observable(null);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);

        this.title = 'Postings';
    }
}

activities.register(ROUTE_NAME, PostingsActivity);
