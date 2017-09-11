/**
    UserFees activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var InputPaymentMethod = require('../models/InputPaymentMethod');
var Address = require('../models/Address');
var paymentPlans = require('../data/paymentPlans');
var userPaymentPlan = require('../data/userPaymentPlan');

var A = Activity.extend(function UserFeesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account', helpLink: this.viewModel.helpLink
    });
    this.title('Loconomics plans');
});

module.exports = A;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.reset();

    Activity.prototype.show.call(this, state);

    // Request to sync plans, just in case there are remote changes
    paymentPlans.sync();
    // Load active plan, if any
    userPaymentPlan.sync();
};

function ViewModel(app) {

    this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';

    this.plans = paymentPlans.list;
    this.activeUserPaymentPlan = userPaymentPlan.data;

    this.selectedPaymentPlanID = ko.observable('');
    this.paymentMethod = new InputPaymentMethod();
    this.paymentMethod.billingAddress(new Address());

    this.reset = function() {
        this.selectedPaymentPlanID('');
        this.paymentMethod.model.reset();
    }.bind(this);

    this.isLoading = ko.pureComputed(function() {
        return paymentPlans.state.isLoading() || userPaymentPlan.isLoading();
    });
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);

    this.isNew = this.activeUserPaymentPlan.isNew;

    this.activePaymentPlan = ko.pureComputed(function(){
        var id = this.activeUserPaymentPlan.paymentPlan();
        if (id) {
            return paymentPlans.getObservableItem(id)();
        }
        else {
            return null;
        }
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

        userPaymentPlan.createSubscription(plain)
        .then(function() {
            this.isSaving(false);
            app.modals.showNotification({ title: 'Payment plan saved', message: 'Thank you' })
            .then(function() {
                // Move forward:
                app.successSave();
            });
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

    this.changePlan = function() {
        app.modals.showNotification({ title: 'Not Implemented', message: 'Not Implemented' });
    };
}
