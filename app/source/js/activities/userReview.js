/**
    Review Service Professional activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var $ = require('jquery');

var A = Activity.extend(function UserReviewActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;

    this.$activity.find('#userReview-index a').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).tab('show');
        var link = $(this).attr('href').replace(/^#userReview-/, '');
        this.app.shell.replaceState(null, null, '#!userReview/' + link);
    });
});

module.exports = A;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var tabName = state && state.route.segments && state.route.segments[0] || 'recommendation';
    var tab = this.$activity.find('[href="#userReview-' + tabName + '"]');
    if (tab.length) tab.tab('show');
};

function ViewModel(app) {
    this.user = app.model.userProfile.data;
    this.clientFirstName = ko.observable('Tim');
    this.serviceProfessionalFirstName = ko.observable('Joshua');
    this.serviceProfessionalJobTitle = ko.observable('Cleaning Professional');
    this.isServiceProfessionalX = ko.observable(true);
    this.isClientX = ko.observable(false);
    this.isBookingEligibleToBeReviewed = ko.observable('1');
    this.isClientAlreadyReviewed = ko.observable('0');
    this.isServiceProfessionalAlreadyReviewed = ko.observable('0');
    this.isClientEligibleToBeReviewed = ko.observable('1');
    this.isServiceProfessionalEligibleToBeReviewed = ko.observable('1');
}
