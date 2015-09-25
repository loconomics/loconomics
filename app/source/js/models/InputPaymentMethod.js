/**
    InputPaymentMethod Model, represents
    the data to be filled in a booking request
    for payment information.
**/
'use strict';

var Address = require('./Address'),
    Model = require('./Model');

function InputPaymentMethod(values) {

    Model(this);
    
    this.model.defProperties({
        paymentMethodID: 0,
        nameOnCard: '',
        cardNumber: 0,
        expirationMonth: 0,
        expirationYear: null,
        securityCode: null,
        billingAddress: { Model: Address },
        savePayment: false
    }, values);
}

module.exports = InputPaymentMethod;
