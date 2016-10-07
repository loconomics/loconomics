/**
    Verification Model
**/
'use strict';

var Model = require('./Model');

function Verification(values) {
    Model(this);

    this.model.defProperties({
        verificationID: 0,
        name: '',
        description: null,
        icon: null,
        summaryGroup: null
    }, values);
}

Verification.status = {
    confirmed: 1,
    pending: 2,
    revoked: 3,
    obsolete: 4
};

// TODO: Maybe as generic utility?
function enumGetName(value, enumList) {
    var found = null;
    Object.keys(enumList).some(function(k) {
        if (enumList[k] === value) {
            found = k;
            return true;
        }
    });
    return found;
}

Verification.getStatusName = function getStatusName(value) {
    return enumGetName(value, Verification.status);
};

module.exports = Verification;
