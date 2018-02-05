/**
    Terms activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var ko = require('knockout');
var DEFAULT_TAB = 'terms-of-service';
require('../kocomponents/tab-list');

var A = Activity.extend(function TermsActivity() {

    Activity.apply(this, arguments);

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
            shell.replaceState(null, null, '#!terms/' + tabName);
        },
        owner: this
    });

    this.title = ko.pureComputed(function() {
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
    }, this);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    if (!this.activeTabName()) {
        this.activeTabName(DEFAULT_TAB);
    }
};
