/**
 * Testing activity '_test-style-elements'. Using CSS components classes and
 * variants, originally proposed as the 'styleguide/patterns library'
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import * as activities from '../index';
import Activity from '../../components/Activity';
import template from './template.html';

const ROUTE_NAME = '_test-style-elements';

export default class _TestStyleElementsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing style elements';
    }
}

activities.register(ROUTE_NAME, _TestStyleElementsActivity);
