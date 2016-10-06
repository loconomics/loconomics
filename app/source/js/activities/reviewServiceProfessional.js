/**
    Review Service Professional activity
**/
'use strict';

var Activity = require('../components/Activity');

var $ = require('jquery');

var A = Activity.extend(function reviewServiceProfessionalActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/scheduling', helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    });
    this.$activity.find('#reviewServiceProfessional-index a').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        var link = $(this).attr('href').replace(/^#reviewServiceProfessional-/, '');
        this.app.shell.replaceState(null, null, '#!reviewServiceProfessional/' + link);
    });
});

module.exports = A;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var tabName = state && state.route.segments && state.route.segments[0] || 'recommendation';
    var tab = this.$activity.find('[href="#reviewServiceProfessional-' + tabName + '"]');
    if (tab.length) tab.tab('show');
};

