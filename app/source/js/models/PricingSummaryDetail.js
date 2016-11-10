/**
**/
'use strict';

var Model = require('./Model');

function PricingSummaryDetail(values) {
    
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
}

module.exports = PricingSummaryDetail;

PricingSummaryDetail.fromServiceProfessionalService = function(service) {
    // TODO Support special hourly pricings, housekeeper, etc.
    var allSessionMinutes = service.numberOfSessions () > 0 ?
        service.serviceDurationMinutes() * service.numberOfSessions() :
        service.serviceDurationMinutes();

    return new PricingSummaryDetail({
        serviceName: service.name(),
        serviceDescription: service.description(),
        numberOfSessions: service.numberOfSessions(),
        serviceDurationMinutes: allSessionMinutes,
        firstSessionDurationMinutes: service.serviceDurationMinutes(),
        price: service.price(),
        serviceProfessionalServiceID: service.serviceProfessionalServiceID(),
        hourlyPrice: (service.priceRateUnit() || '').toUpperCase() === 'HOUR' ? service.priceRate() : null
    });
};
