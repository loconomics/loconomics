/**
    Terms activity
**/
'use strict';

var Activity = require('../components/Activity');

var $ = require('jquery');

var A = Activity.extend(function TermsActivity() {
    
    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;
    
    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    this.$activity.find('#terms-index a').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        if (window.history && window.history.replaceState) {
            var link = $(this).attr('href').replace(/^#terms-/, '');
            window.history.replaceState(null, null, '#!terms/' + link);
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var tabName = state && state.route.segments && state.route.segments[0] || 'terms-of-service';
    var tab = this.$activity.find('[href="#terms-' + tabName + '"]');
    if (tab.length) tab.tab('show');
};
