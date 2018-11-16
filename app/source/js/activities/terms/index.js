/**
 * Terms activity
 *
 * @module activities/terms
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/nav/website-footer';
import '../../kocomponents/tab-list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import ko from 'knockout';
import shell from '../../app.shell';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'terms';
const DEFAULT_TAB = 'terms-of-service';

export default class TermsActivity extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // Any user can access this
        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);

        var observableRoute = shell.getCurrentObservableRoute();
        this.activeTabName = ko.pureComputed({
            read: function() {
                var route = observableRoute();
                return route && route.segments && route.segments[0];
            },
            write: function(tabName) {
                shell.replaceState(null, null, '#!terms/' + tabName);
            },
            owner: this
        });

        /**
         * Dynamic title, depending on the active tab with a default one
         * @member {KnockoutComputed<string>}
         */
        this.title = ko.pureComputed(() => {
            switch (this.activeTabName()) {
                case 'privacy-policy':
                    return 'PRIVACY POLICY';
                case 'background-check-policy':
                    return 'BACKGROUND CHECK AND LICENSE VERIFICATION POLICY';
                case 'fees':
                    return 'FEES';
                case 'business-associate-agreement':
                    return 'BUSINESS ASSOCIATE AGREEMENT';
                case 'accessibility-policy':
                    return 'ACCESSIBILITY POLICY';
                default:
                    return 'TERMS OF SERVICE';
            }
        });
    }

    show(state) {
        super.show(state);

        if (!this.activeTabName()) {
            this.activeTabName(DEFAULT_TAB);
        }
    }
}

activities.register(ROUTE_NAME, TermsActivity);
