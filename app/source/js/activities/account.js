/**
    Account activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
import Activity from '../components/Activity';
import ko from 'knockout';
import paymentPlans from '../data/paymentPlans';
import { data as user } from '../data/userProfile';
import userPaymentPlan from '../data/userPaymentPlan';

var A = Activity.extend(function AccountActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel();
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Your Account');
});

exports.init = A.init;

A.prototype.show = function show(state) {

    Activity.prototype.show.call(this, state);

    // Request to sync plans, just in case there are remote changes
    paymentPlans.sync();
    // Load active plan, if any
    userPaymentPlan.sync();
};

function ViewModel() {
    this.isServiceProfessional = user.isServiceProfessional;
    this.activeUserPaymentPlan = userPaymentPlan.data;
    this.activePaymentPlan = ko.pureComputed(() => {
        var id = this.activeUserPaymentPlan.paymentPlan();
        if (id) {
            return paymentPlans.getObservableItem(id)();
        }
        else {
            return null;
        }
    });
}
