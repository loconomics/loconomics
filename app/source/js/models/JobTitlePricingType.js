/**
    Defines the relationship between a JobTitle and a PricingType.
**/
'use strict';

var Model = require('./Model');

function JobTitlePricingType(values) {

    Model(this);
    
    this.model.defProperties({
        pricingTypeID: 0,
        // NOTE: Client Type is mostly unused today but exists
        // on all database records. It uses the default value
        // of 1 all the time for now.
        clientTypeID: 1,
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['pricingTypeID', 'clientTypeID']);
}

module.exports = JobTitlePricingType;
