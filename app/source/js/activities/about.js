/**
    About activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var $ = require('jquery');

var A = Activity.extend(function AboutActivity() {

    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;

    // null for logos
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    var shell = this.app.shell;
    this.$activity.find('#about-index a').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        var link = $(this).attr('href').replace(/^#about-/, '');
        shell.replaceState(null, null, '#!about/' + link);
    });
    this.title = ko.pureComputed(function() {
        return shell === '#!about/press' ? 'Press' : shell == '#!about/careers' ? 'Careers' : 'About Loconomics cooperative';
    }, this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var tabName = state && state.route.segments && state.route.segments[0] || 'us';
    var tab = this.$activity.find('[href="#about-' + tabName + '"]');
    if (tab.length) tab.tab('show');
};
