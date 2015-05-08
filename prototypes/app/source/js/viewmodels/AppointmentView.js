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

    appointment.customer = ko.computed(function() {
        var b = this.sourceBooking();
        if (!b) return null;
        
        var cid = this.customerUserID();
        if (cid) {
            return app.model.customers.getObservableItem(cid, true)();
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
        freelancerPricing.
    */
    appointment.pricingWithInfo = ko.computed(function() {
        var b = this.sourceBooking();
        if (!b) return [];

        var jid = this.jobTitleID(),
            details = this.pricing();

        return details.map(function(det) {
            return PricingEstimateDetailView(det, jid, app);
        });
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 60 } });

    appointment.servicesSummary = ko.computed(function() {
        return this.pricingWithInfo()
        .map(function(service) {
            return service.freelancerPricing().name();
        }).join(', ');
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    // TODO Review for any change of compute the full service duration
    appointment.serviceDurationMinutes = ko.computed(function() {
        var pricing = this.pricingWithInfo();
        var sum = pricing.reduce(function(prev, service) {
            return prev + service.freelancerPricing().serviceDurationMinutes();
        }, 0);

        return sum;
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    // TODO Review if calculation of fees and that is needed
    ko.computed(function() {
        var pricing = appointment.pricing();
        this.price(pricing.reduce(function(prev, cur) {
            return prev + cur.totalPrice();
        }, 0));
    }, appointment)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    return appointment;
};

function PricingEstimateDetailView(pricingEstimateDetail, jobTitleID, app) {

    pricingEstimateDetail.freelancerPricing = ko.computed(function() {
        var pid = this.freelancerPricingID();
        return app.model.freelancerPricing
            .getObservableItem(jobTitleID, pid, true)();
    }, pricingEstimateDetail)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    return pricingEstimateDetail;
}
