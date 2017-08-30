/**
    Cancellation Policies activity
    Public information about policies
**/
'use strict';

var $ = require('jquery'),
    Activity = require('../components/Activity');
var cancellationPolicies = require('../data/cancellationPolicies');

var A = Activity.extend(function CancellationPoliciesActivity() {

    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;

    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    this.title('Cancellation policies');
    this.viewModel = new ViewModel(this.app);
    var shell = this.app.shell;
    this.$activity.find('#cancellationPolicies-index').on('click', 'a', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        var link = $(this).attr('href').replace(/^#cancellationPolicies-/, '');
        shell.replaceState(null, null, '#!cancellationPolicies/' + link);
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var tabName = state && state.route.segments && state.route.segments[0];
    var tab = this.$activity.find('[href="#cancellationPolicies-' + tabName + '"]');
    if (tab.length) tab.tab('show');

    // Request to sync policies, just in case there are remote changes
    cancellationPolicies.sync();
};

function ViewModel() {
    this.isLoading = cancellationPolicies.state.isLoading;
    this.policies = cancellationPolicies.list;
}

