/** User Fee Payment model
 **/
'use strict';

var Model = require('../models/Model');

function UserFeePayment(values) {

    Model(this);

    this.model.defProperties({
        userFeePaymentID: 0,
        userID: 0,
        paymentTransactionID: '',
        subscriptionID: '',
        paymentDate: null,
        paymentPlan: '',
        paymentAmount: 0,
        paymentMethod: '',
        paymentStatus: '',
        createdDate: null,
        updatedDate: null
    }, values);
}

module.exports = UserFeePayment;
