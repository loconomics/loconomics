/**
 * DownloadApp activity
 *
 * @module activities/download-app
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import template from './template.html';

const ROUTE_NAME = 'download-app';

export default class DownloadAppActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Download our app';
    }
}

activities.register(ROUTE_NAME, DownloadAppActivity);
