/**
 * Displays a list of suggested GIG postings for the user.
 *
 * @module activities/suggested-postings
 *
 */

import '../../kocomponents/posting/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import { list as suggestedPostings } from '../../data/suggestedPostings';
import template from './template.html';

const ROUTE_NAME = 'suggested-postings';

export default class SuggestedPostingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Suggested postings';

        this.list = ko.observableArray();

        /**
         * Creates link to where to view the posting details
         * @param {rest/UserPosting} item An user posting plain object
         * @returns {string}
         */
        this.linkToViewItem = (item) => `/suggested-postings/${item.userPostingID}`;
    }

    onSelect(item) {
        shell.go(this.linkToViewItem(item));
    }

    show(state) {
        super.show(state);

        this.subscribeTo(suggestedPostings.onData, this.list);
        this.subscribeTo(suggestedPostings.onDataError, (error) => {
            showError({
                title: 'There was an error loading suggested postings',
                error
            });
        });
    }
}

activities.register(ROUTE_NAME, SuggestedPostingsActivity);
