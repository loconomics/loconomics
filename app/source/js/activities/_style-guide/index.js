/**
 * Testing activity '_style-guide'.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = '_style-guide';

export default class _StyleGuideActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = UserType.loggedUser;
        this.title = 'Testing StyleGuide';
    }
}

activities.register(ROUTE_NAME, _StyleGuideActivity);
