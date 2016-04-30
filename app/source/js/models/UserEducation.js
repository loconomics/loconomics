/**
    Represents an User Education record
**/
'use strict';

var Model = require('./Model');

function UserEducation(values) {
    Model(this);
    
    this.model.defProperties({
        educationID: 0,
        userID: 0,
        institutionName: '',
        degreeCertificate: '',
        fieldOfStudy: '',
        fromYearAttended: null,
        toYearAttended: null
    }, values);
}

module.exports = UserEducation;
