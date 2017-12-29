/** JobTitle Licenses model.
 **/
'use strict';

var Model = require('./Model');
var JobTitleMunicipalLicense = require('./JobTitleMunicipalLicense');
var JobTitleCountyLicense = require('./JobTitleCountyLicense');
var JobTitleStateProvinceLicense = require('./JobTitleStateProvinceLicense');
var JobTitleCountryLicense = require('./JobTitleCountryLicense');

function JobTitleLicenses(values) {
//Calling Model and passing in the arrays using the defProperties method. The properties will be a ko observable using defProperties. 
    Model(this);

    this.model.defProperties({
        municipality: {
            isArray: true,
            Model: JobTitleMunicipalLicense
        },
        county: {
            isArray: true,
            Model: JobTitleCountyLicense
        },
        stateProvince: {
            isArray: true,
            Model: JobTitleStateProvinceLicense
        },
        country: {
            isArray: true,
            Model: JobTitleCountryLicense
        },
    }, values);
}

module.exports = JobTitleLicenses;
