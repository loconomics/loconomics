/** User Payment Plan model
 **/
'use strict';

var Model = require('../models/Model');

function UserPaymentPlan(values) {

    Model(this);

    this.model.defProperties({
        userPaymentPlanID: 0,
        userID: 0,
        subscriptionID: '',
        paymentPlan: '',
        paymentMethod: '',
        paymentPlanLastChangedDate: null,
        nextPaymentDueDate: null,
        nextPaymentAmount: null,
        firstBillingDate: null,
        subscriptionEndDate: null,
        paymentMethodToken: null,
        paymentExpiryDate: null,
        planStatus: '',
        daysPastDue: null
    }, values);
}

module.exports = UserPaymentPlan;
