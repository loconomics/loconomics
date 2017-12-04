/**
    UserFeePayments activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var userFeePayments = require('../data/userFeePayments');
var showError = require('../modals/error').show;

var A = Activity.extend(function UserFeePaymentsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel();

    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account', helpLink: this.viewModel.helpLink
    });
    this.title('Payment history');
});

module.exports = A;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Payments
    userFeePayments.getList()
    .then(function(threads) {
        this.viewModel.payments(threads());
    }.bind(this))
    .catch(function(err) {
        showError({
            title: 'Error loading payments',
            error: err
        });
    });
};

function ViewModel() {

    this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';

    this.isLoading = userFeePayments.state.isLoading;
    this.isSyncing = userFeePayments.state.isSyncing;

    this.payments = ko.observableArray([]);
}
