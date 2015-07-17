// TODO Incomplete Model for UI mockup
'use strict';

var Model = require('./Model');

function UserEducation(values) {
    Model(this);
    
    this.model.defProperties({
        educationID: 0,
        school: '',
        degree: '',
        field: '',
        startYear: null,
        endYear: null
    }, values);
}

module.exports = UserEducation;
