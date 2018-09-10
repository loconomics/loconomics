/**
 * CancellationPolicies
 *
 * @module activities/cancellation-policies
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/tab-list';
import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import cancellationPolicies from '../../data/cancellationPolicies';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'cancellation-policies';

export default class CancellationPolicies extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // Any user can access this
        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Cancellation policies';

        var shell = app.shell;
        var observableRoute = shell.getCurrentObservableRoute();
        /// Properties used in the view
        this.activeTabName = ko.pureComputed({
            read: function() {
                var route = observableRoute();
                return route && route.segments && route.segments[0];
            },
            write: function(tabName) {
                shell.replaceState(null, null, '#!cancellation-policies/' + tabName);
            },
            owner: this
        });
        this.isLoading = cancellationPolicies.state.isLoading;
        this.policies = cancellationPolicies.list;
    }

    show(state) {
        super.show(state);

        // Request to sync policies, just in case there are remote changes
        cancellationPolicies.sync();
    }
}

activities.register(ROUTE_NAME, CancellationPolicies);
