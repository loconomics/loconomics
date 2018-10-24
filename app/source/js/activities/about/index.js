/**
    About activity
**/
'use strict';

import '../../kocomponents/nav/website-footer';
import '../../kocomponents/tab-list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'about';
const DEFAULT_TAB = 'us';

export default class AboutActivity extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // Any user can access this
        this.accessLevel = null;

        // null for logos
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        var shell = this.app.shell;
        var observableRoute = shell.getCurrentObservableRoute();
        this.activeTabName = ko.pureComputed({
            read: function() {
                var route = observableRoute();
                return route && route.segments && route.segments[0];
            },
            write: function(tabName) {
                shell.replaceState(null, null, '#!about/' + tabName);
            },
            owner: this
        });

        this.title = ko.pureComputed(function() {
            switch (this.activeTabName()) {
                case 'press':
                    return 'Press';
                case 'careers':
                    return 'Careers';
                default:
                    return 'About Loconomics Cooperative';
            }
        }, this);
    }

    show(state) {
        super.show(state);

        if (!this.activeTabName()) {
            this.activeTabName(DEFAULT_TAB);
        }
    }
}

activities.register(ROUTE_NAME, AboutActivity);
