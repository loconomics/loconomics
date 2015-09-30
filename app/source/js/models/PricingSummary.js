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
        feePrice: null,
        totalPrice: null,
        pFeePrice: null,
        subtotalRefunded: null,
        feeRefunded: null,
        totalRefunded: null,
        dateRefunded: null,
        
        createdDate: null,
        updatedDate: null,
        
        details: {
            Model: PricingSummaryDetail,
            isArray: true
        }
    }, values);
    
    this.servicesSummary = ko.computed(function() {
        return this.details()
        .map(function(detail) {
            return detail.serviceName();
        }).join(', ');
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
};
