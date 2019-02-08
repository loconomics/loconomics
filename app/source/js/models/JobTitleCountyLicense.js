/** JobTitleCountyLicense model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function JobTitleCountyLicense(values) {

    Model(this);

    this.model.defProperties({
        jobTitleID: 0,
        licenseCertificationID: 0,
        required: 0,
        countyID: 0,
        countyName: '',
        language: '',
        submitted: 0,
        optionGroup: '',

        licenseCertification: new LicenseCertification()
    }, values);
}

module.exports = JobTitleCountyLicense;
