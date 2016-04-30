/** PaymentAccount model.
 **/
'use strict';

var Model = require('./Model');

function PaymentAccount(values) {
    
    Model(this);

    this.model.defProperties({
        userID: '',
        firstName: '',
        lastName: '',
        phone: '',
        streetAddress: '',
        city: '',
        postalCode: '',
        routingNumber: '',
        accountNumber: '',
        ssn: '',
        stateProvinceCode: '',
        birthDate: '',
        isVenmo: false,
        agree: false,
        status: '',
        errors: {
            isArray: true
        } // [string]
    }, values);
}

module.exports = PaymentAccount;
