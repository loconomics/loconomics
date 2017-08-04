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
 * @enum {string}
 */
var AvailableOptions = {
    directDeposit: 'direct-deposit',
    venmo: 'venmo'
};

/**
 * List of available options
 * @type {Array<models/PaymentPreferenceOption>}
 */
var optionsList = [
    new PaymentPreferenceOption({
        paymentPreferenceOptionID: AvailableOptions.directDeposit,
        name: 'Direct deposit',
        description: 'Your bank account information to receive payments through Braintree'
    }),
    new PaymentPreferenceOption({
        paymentPreferenceOptionID: AvailableOptions.venmo,
        name: 'Venmo',
        description: 'You will have to set up your Venmo account to release payments'
    })
];

PaymentPreferenceOption.AvailableOptions = AvailableOptions;
PaymentPreferenceOption.optionsList = optionsList;
