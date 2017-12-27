/**
    About activity
**/
'use strict';

import '../../kocomponents/tab-list';
import Activity from '../../components/Activity';
import STYLE from './style.styl';
import ko from 'knockout';
var DEFAULT_TAB = 'us';

export default class AboutActivity extends Activity {
    constructor($activity, app) {
        super($activity, app);

        this.style = STYLE;
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
                    return 'About Loconomics cooperative';
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
