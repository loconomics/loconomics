/**
 * Education
 *
 * @module activities/education
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import education from '../../data/education';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'education';

export default class Education extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201960833-adding-education-to-your-profile';
        this.navBar = Activity.createSubsectionNavBar('Profile', {
            backLink: '/user-profile',
            helpLink: this.helpLink
        });
        this.title = 'Education';

        // View properties
        this.isLoading = education.state.isLoading;
        this.isSyncing = education.state.isSyncing;
        this.list = education.list;
    }

    show(state) {
        super.show(state);

        // Request a sync and catch any error
        education.sync()
        .catch((error) => {
            showError({
                title: 'Error loading education information',
                error
            });
        });
    }
}

activities.register(ROUTE_NAME, Education);
