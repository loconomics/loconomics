/**
 * Displays the list of GIG postings made by the user.
 *
 * @module activities/postings
 *
 */

import '../../kocomponents/posting/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import shell from '../../app.shell';
import template from './template.html';

const ROUTE_NAME = 'postings';

export default class PostingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.client;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Postings';

        /**
         * Creates link to where to edit the posting
         * @param {rest/UserPosting} item An user posting plain object
         * @returns {string}
         */
        this.linkToEditItem = (item) => `/posting/${item.userPostingID}`;
    }

    onSelect(item) {
        shell.go(this.linkToEditItem(item));
    }
}

activities.register(ROUTE_NAME, PostingsActivity);
