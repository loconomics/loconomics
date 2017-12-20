/**
    About activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var DEFAULT_TAB = 'us';
require('../kocomponents/tab-list');

export default class AboutActivity extends Activity {
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
