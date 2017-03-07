/**
    UserFees activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var InputPaymentMethod = require('../models/InputPaymentMethod');

var A = Activity.extend(function UserFeesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account', helpLink: this.viewModel.helpLink
    });
});

module.exports = A;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.reset();

    Activity.prototype.show.call(this, state);

    // Request to sync plans, just in case there are remote changes
    this.app.model.paymentPlans.sync();
    // Load titles to display for selection
    this.app.model.userPaymentPlan.sync();
};

function ViewModel(app) {

    this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';

    this.plans = app.model.paymentPlans.list;
    this.activePaymentPlan = app.model.userPaymentPlan.data;

    this.selectedPaymentPlanID = ko.observable(null);
    this.paymentMethod = new InputPaymentMethod();

    this.reset = function() {
        this.selectedPaymentPlanID(null);
        this.paymentMethod.model.reset();
    }.bind(this);

    this.isLoading = ko.pureComputed(function() {
        return app.model.paymentPlans.state.isLoading() || app.model.userPaymentPlan.isLoading();
    });
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);

    this.isNew = ko.pureComputed(function() {
        return !this.activePaymentPlan.userPaymentPlanID();
    }, this);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'loading...' :
                this.isSaving() ?
                    'saving...' :
                    'Save'
        );
    }, this);

    var createSubscription = function() {
        var plain = {
            paymentPlan: this.selectedPaymentPlanID(),
            paymentMethod: this.paymentMethod.model.toPlainObject(true)
        };

        app.model.userPaymentPlan.createSubscription(plain)
        .then(function() {
            this.isSaving(false);
            // Move forward:
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            this.isSaving(false);
            app.modals.showError({ title: 'Error creating your subscription', error: err });
        }.bind(this));
    }.bind(this);

    this.save = function() {
        this.isSaving(true);

        if (this.isNew()) {
            createSubscription();
        }
        else {
            throw { name: 'NotImplemented', description: 'Change active plan' };
        }
    }.bind(this);
}
