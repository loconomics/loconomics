/**
**/
'use strict';

var Model = require('./Model');

module.exports = function PricingSummaryDetail(values) {
    
    Model(this);

    this.model.defProperties({
        pricingSummaryID: 0,
        pricingSummaryRevision: 0,
        serviceProfessionalServiceID: 0,
        serviceProfessionalDataInput: null,
        clientDataInput: null,
        hourlyPrice: null,
        price: null,
        serviceDurationMinutes: null,
        firstSessionDurationMinutes: null,
        serviceName: '',
        serviceDescription: null,
        numberOfSessions: 1,
        createdDate: null,
        updatedDate: null
    }, values);
};
