/**
    Appointment View model that wraps an Appointment
    model instance extended with extra methods connected
    to related data
**/
'use strict';

var ko = require('knockout');

module.exports = function AppointmentView(appointment, app) {
    if (appointment._isAppointmentView) return appointment;
    appointment._isAppointmentView = true;

    appointment.client = ko.computed(function() {
        var b = this.sourceBooking();
        if (!b) return null;
        
        var cid = this.clientUserID();
        if (cid) {
            return app.model.clients.getObservableItem(cid, true)();
        }
        return null;
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    appointment.address = ko.computed(function() {
        var aid = this.addressID(),
            jid = this.jobTitleID();
        if (aid && jid) {
            return app.model.serviceAddresses.getObservableItem(jid, aid, true)();
        }
        return null;
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    appointment.addressSummary = ko.computed(function() {
        var eventData = this.sourceEvent();
        var add = this.address();
        return add && add.singleLine() || eventData && eventData.location() || '';
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    /* Property with the pricing array plus information about the
        serviceProfessionalService.
    */
    appointment.pricingWithInfo = ko.computed(function() {
        var b = this.sourceBooking();
        if (!b) return [];

        var jid = this.jobTitleID(),
            details = this.pricing();

        return details.map(function(det) {
            return PricingSummaryDetailView(det, jid, app);
        });
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 60 } });

    appointment.servicesSummary = ko.computed(function() {
        return this.pricingWithInfo()
        .map(function(service) {
            return service.serviceProfessionalService().name();
        }).join(', ');
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    // ServiceDuration as function, because is needed for cases when cannot wait for the 
    // rated computed
    appointment.getServiceDurationMinutes = function() {
        var pricing = this.pricingWithInfo();
        var sum = pricing.reduce(function(prev, service) {
            return prev + service.serviceProfessionalService().serviceDurationMinutes();
        }, 0);
        return sum;
    };
    // ServiceDuration as computed so can be observed for changes
    appointment.serviceDurationMinutes = ko.computed(function() {
        return this.getServiceDurationMinutes();
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    ko.computed(function() {
        var pricing = appointment.pricing();
        this.price(pricing.reduce(function(prev, cur) {
            return prev + cur.price();
        }, 0));
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    return appointment;
};

function PricingSummaryDetailView(pricingSummaryDetail, jobTitleID, app) {

    pricingSummaryDetail.serviceProfessionalService = ko.computed(function() {
        var pid = this.serviceProfessionalServiceID();
        return app.model.serviceProfessionalServices
            .getObservableItem(jobTitleID, pid, true)();
    }, pricingSummaryDetail)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    return pricingSummaryDetail;
}
