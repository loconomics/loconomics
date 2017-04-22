/** Payment Plan model
 **/
'use strict';

var Model = require('../models/Model');

function PaymentPlan(values) {

    Model(this);

    this.model.defProperties({
        paymentPlanID: '',
        name: '',
        description: ''
    }, values);
}

module.exports = PaymentPlan;
