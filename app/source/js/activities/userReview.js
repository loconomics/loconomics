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
    this.isServiceProfessional = ko.observable(false);
    this.isClient = ko.observable(true);
    this.isBookingEligibleToBeReviewed = ko.observable(true);
    this.isClientAlreadyReviewed = ko.observable(false);
    this.isServiceProfessionalAlreadyReviewed = ko.observable(false);
    this.isClientEligibleToBeReviewed = ko.observable(true);
    this.isServiceProfessionalEligibleToBeReviewed = ko.observable(true);
    this.answer1 = ko.observable(null);
    this.publicReview = ko.observable('');
    this.privateReview = ko.observable('');
    this.rating1 = ko.observable(null);
    this.rating2 = ko.observable(null);
    this.rating3 = ko.observable(null);
    this.rating4 = ko.observable(null);
}
