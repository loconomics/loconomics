/**
    Terms activity
**/
'use strict';

var Activity = require('../components/Activity');

var $ = require('jquery');
var ko = require('knockout');

var A = Activity.extend(function TermsActivity() {
    
    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;
    
    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    var shell = this.app.shell;
    this.$activity.find('#terms-index a').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        var link = $(this).attr('href').replace(/^#terms-/, '');
        shell.replaceState(null, null, '#!terms/' + link);
    });
    this.title = ko.pureComputed(function() {
        var route = shell.currentRouteObservable();
        var segment = route && route.segments && route.segments[0];
        switch (segment) {
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
    }, this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var tabName = state && state.route.segments && state.route.segments[0] || 'terms-of-service';
    var tab = this.$activity.find('[href="#terms-' + tabName + '"]');
    if (tab.length) tab.tab('show');
};
