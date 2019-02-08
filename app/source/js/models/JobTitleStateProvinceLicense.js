/** JobTitleStateProvinceLicense model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function JobTitleStateProvinceLicense(values) {

    Model(this);

    this.model.defProperties({
        jobTitleID: 0,
        licenseCertificationID: 0,
        required: 0,
        stateProvinceID: 0,
        stateProvinceName: '',
        language: '',
        submitted: 0,
        optionGroup: '',

        licenseCertification: new LicenseCertification()
    }, values);
}

module.exports = JobTitleStateProvinceLicense;
