/**
    OwnerInfo activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function OwnerInfoActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();

    this.accessLevel = this.app.UserType.serviceProfessional;
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Cooperative');
});

exports.init = A.init;

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201096629-ownership-in-loconomics';
    this.ownerStatus = ko.observable('pending');
    this.ownerStatusName = ko.observable('Pending');
    this.ownerStatusOK = ko.pureComputed(function() {
        return this.ownerStatus() === 'active';
    }, this);
}
