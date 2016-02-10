/**
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    PricingSummaryDetail = require('./PricingSummaryDetail');

module.exports = function PricingSummary(values) {
    
    Model(this);

    this.model.defProperties({
        pricingSummaryID: 0,
        pricingSummaryRevision: 0,
        serviceDurationMinutes: null,
        firstSessionDurationMinutes: null,
        
        subtotalPrice: null,
        clientServiceFeePrice: null,
        totalPrice: null,
        serviceFeeAmount: null,
        cancellationFeeCharged: null,
        cancellationDate: null,
        firstTimeServiceFeeFixed: null,
        firstTimeServiceFeePercentage: null,
        paymentProcessingFeePercentage: null,
        paymentProcessingFeeFixed: null,
        firstTimeServiceFeeMaximum: null,
        firstTimeServiceFeeMinimum: null,
        
        createdDate: null,
        updatedDate: null,
        
        details: {
            Model: PricingSummaryDetail,
            isArray: true
        }
    }, values);
    
    this.servicesSummary = ko.pureComputed(function() {
        return this.details()
        .map(function(detail) {
            return detail.serviceName();
        }).join(', ');
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
};
