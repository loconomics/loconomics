/**
 * Payment Preference Option model
 * @module models/PaymentPreferenceOption
 */
'use strict';

var Model = require('../models/Model');

function PaymentPreferenceOption(values) {

    Model(this);

    this.model.defProperties({
        paymentPreferenceOptionID: '',
        name: '',
        description: ''
    }, values);
}

module.exports = PaymentPreferenceOption;

/**
 * List of available options, since is predefined data
 */
var AvailableOptions = [
    new PaymentPreferenceOption({
        paymentPreferenceOptionID: 'direct-deposit',
        name: 'Direct deposit',
        description: 'Your bank account information to receive payments through Braintree'
    }),
    new PaymentPreferenceOption({
        paymentPreferenceOptionID: 'venmo',
        name: 'Venmo',
        description: 'You will have to set up your Venmo account to release payments'
    })
];

PaymentPreferenceOption.AvailableOptions = AvailableOptions;
