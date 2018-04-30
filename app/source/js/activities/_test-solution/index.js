/**
 * Testing activity around 'solution' components like solution-autocomplete.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import * as activities from '../index';
import { ActionForValue } from '../../kocomponents/solution/autocomplete';
import Activity from '../../components/Activity';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = '_test-solution';

export default class _TestSolutionActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing Solution';

        this.selectedSolution = ko.observable(null);
    }

    selectSolution(text, solution) {
        this.selectedSolution(solution);
        return {
            value: ActionForValue.clear
        };
    }
}

activities.register(ROUTE_NAME, _TestSolutionActivity);
