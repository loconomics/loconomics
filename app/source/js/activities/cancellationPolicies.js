/**
    Cancellation Policies activity
    Public information about policies
**/
'use strict';

var Activity = require('../components/Activity');
var cancellationPolicies = require('../data/cancellationPolicies');
var ko = require('knockout');
require('../kocomponents/tab-list');

var A = Activity.extend(function CancellationPoliciesActivity() {

    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;

    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    this.title('Cancellation policies');

    var shell = this.app.shell;
    var observableRoute = shell.getCurrentObservableRoute();
    /// Properties used in the view
    this.activeTabName = ko.pureComputed({
        read: function() {
            var route = observableRoute();
            return route && route.segments && route.segments[0];
        },
        write: function(tabName) {
            shell.replaceState(null, null, '#!cancellationPolicies/' + tabName);
        },
        owner: this
    });
    this.isLoading = cancellationPolicies.state.isLoading;
    this.policies = cancellationPolicies.list;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Request to sync policies, just in case there are remote changes
    cancellationPolicies.sync();
};
