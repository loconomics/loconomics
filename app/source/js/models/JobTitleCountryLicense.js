/** JobTitleCountryLicense model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function JobTitleCountryLicense(values) {

    Model(this);
    
    this.model.defProperties({
        jobTitleID: 0,
        licenseCertificationID: 0,
        required: 0,
        countryID: 0,
        countryName: '',
        languageID: 0,
        
        licenseCertification: new LicenseCertification()
    }, values);
}

module.exports = JobTitleCountryLicense;
