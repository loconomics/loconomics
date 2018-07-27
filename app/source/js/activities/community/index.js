/**
 * Community activity
 *
 * @module activities/community
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'community';

export default class CommunityActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Community';

        this.helpLink = '/help/relatedArticles/201096629-ownership-in-loconomics';
    }
}

activities.register(ROUTE_NAME, CommunityActivity);
