/**
 * Testing activity for specialization autocomplete
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */

import * as activities from '../index';
import { ActionForValue } from '../../kocomponents/specialization/autocomplete';
import Activity from '../../components/Activity';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = '_test-specialization';

export default class _TestSpecializationActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing area';

        this.solutionID = ko.observable(null);
        this.list = ko.observableArray([]);
    }

    onSelect(text, specialization) {
        this.list.push(specialization);
        return {
            value: ActionForValue.clear
        };
    }

    show(state) {
        super.show(state);

        this.solutionID(state.route.segments[0]);
    }
}

activities.register(ROUTE_NAME, _TestSpecializationActivity);
