/**
**/
'use strict';

var Model = require('./Model');

module.exports = function PricingEstimateDetail(values) {
    
    Model(this);

    this.model.defProperties({
        serviceProfessionalServiceID: 0,
        serviceProfessionalDataInput: null,
        clientDataInput: null,
        hourlyPrice: null,
        subtotalPrice: null,
        feePrice: null,
        totalPrice: null,
        serviceDurationHours: null,
        firstSessionDurationHours: null,
        
        createdDate: null,
        updatedDate: null
    }, values);
};
