/**
    UserFeePayments activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function UserFeePaymentsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account', helpLink: this.viewModel.helpLink
    });
});

module.exports = A;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Payments
    this.app.model.userFeePayments.getList()
    .then(function(threads) {
        this.viewModel.payments(threads());
    }.bind(this))
    .catch(function(err) {
        this.app.modals.showError({
            title: 'Error loading payments',
            error: err
        });
    }.bind(this));
};

function ViewModel(app) {

    this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';

    this.isLoading = app.model.userFeePayments.state.isLoading;
    this.isSyncing = app.model.userFeePayments.state.isSyncing;

    this.payments = ko.observableArray([]);
}
