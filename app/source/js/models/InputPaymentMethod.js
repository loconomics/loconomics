/**
    InputPaymentMethod Model, represents
    the data to be filled in a booking request
    for payment information.
**/
'use strict';

var Address = require('./Address'),
    Model = require('./Model'),
    ko = require('knockout');

function InputPaymentMethod(values) {

    Model(this);
    
    this.model.defProperties({
        paymentMethodID: '',
        nameOnCard: '',
        cardNumber: null,
        expirationMonth: null,
        expirationYear: null,
        securityCode: null,
        billingAddress: { Model: Address },
        savePayment: false
    }, values);
    
    this.expirationMonthYear = ko.computed({
        read: function() {
            var m = this.expirationMonth(),
                y = this.expirationYear();
            
            if (!m && !y) return '';

            return padLeft(m, 2, '0') + '/' + padLeft(y, 4, '0');
        },
        write: function(value) {
            var parts = value.split('/');
            if (parts.length === 2) {
                this.expirationMonth(padLeft(parts[0] |0, 2, '0'));
                this.expirationYear(padLeft(parts[1] |0, 4, '0'));
            }
        },
        owner: this
    });
}

module.exports = InputPaymentMethod;

function padLeft(v, length, padLetter) {
    if (!v) return '';
    v = v.toString();
    while (v.length < length) {
        v = padLetter + v;
    }
    return v;
}

