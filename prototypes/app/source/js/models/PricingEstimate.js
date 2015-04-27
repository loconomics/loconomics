/**
**/
'use strict';

var Model = require('./Model'),
    PricingEstimateDetail = require('./PricingEstimateDetail');

module.exports = function PricingEstimate(values) {
    
    Model(this);

    this.model.defProperties({
        pricingEstimateID: 0,
        pricingEstimateRevision: 0,
        serviceDurationHours: null,
        firstSessionDurationHours: null,
        subtotalPrice: null,
        feePrice: null,
        totalPrice: null,
        pFeePrice: null,
        subtotalRefunded: null,
        feeRefunded: null,
        totalRefunded: null,
        dateRefunded: null,
        
        createdDate: null,
        updatedDate: null,
        
        details: []
    }, values);
    
    if (values && Array.isArray(values.details)) {
        this.details(values.details.map(function(detail) {
            return new PricingEstimateDetail(detail);
        }));
    }
};
