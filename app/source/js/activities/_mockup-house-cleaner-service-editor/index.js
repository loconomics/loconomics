/**
 * MockupHouseCleanerServiceEditor
 *
 * @module activities/_mockup-house-cleaner-service-editor
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = '_mockup-house-cleaner-service-editor';

export default class _MockupHouseCleanerServiceEditor extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSubsectionNavBar('Scheduler', {
            backLink: '/scheduling',
            helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
        });
        this.title = 'Mockup House Cleaner Service Editor';
    }
}

activities.register(ROUTE_NAME, _MockupHouseCleanerServiceEditor);
