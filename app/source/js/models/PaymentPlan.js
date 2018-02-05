/** Payment Plan model
 **/
'use strict';

var Model = require('../models/Model');

function PaymentPlan(values) {

    Model(this);

    this.model.defProperties({
        paymentPlanID: '',
        name: '',
        summary: '',
        /**
         * Whether this plan is available for specific partnerships
         */
        partnership: false,
        description: ''
    }, values);
}

module.exports = PaymentPlan;
