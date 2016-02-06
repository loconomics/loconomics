/** Booking model.

    Describes a booking and related data,
    mainly the pricing summary and details, but
    can hold other related data if optionally loaded
    (address, dates, publicUserJobTitle)
 **/
'use strict';

var ko = require('knockout');
var Model = require('./Model'),
    PricingSummary = require('./PricingSummary'),
    PublicUserJobTitle = require('./PublicUserJobTitle'),
    Address = require('./Address'),
    EventDates = require('./EventDates');

function Booking(values) {
    
    Model(this);

    this.model.defProperties({
        bookingID: 0,
        clientUserID: 0,
        serviceProfessionalUserID: 0,
        jobTitleID: 0,
        languageID: 0,
        countryID: 0,
        bookingStatusID: 0,
        bookingTypeID: 0,
        cancellationPolicyID: 0,
        parentBookingID: null,
        
        serviceAddressID: null,
        serviceDateID: null,
        alternativeDate1ID: null,
        alternativeDate2ID: null,
        
        pricingSummaryID: 0,
        pricingSummaryRevision: 0,
        paymentLastFourCardNumberDigits: null,
        totalPricePaidByClient: null,
        totalServiceFeesPaidByClient: null,
        totalPaidToServiceProfessional: null,
        totalServiceFeesPaidByServiceProfessional: null,

        instantBooking: false,
        firstTimeBooking: false,
        sendReminder: false,
        sendPromotional: false,
        recurrent: false,
        multiSession: false,
        pricingAdjustmentApplied: false,
        paymentEnabled: false,
        paymentCollected: false,
        paymentauthorized: false,
        awaitingResponseFromUserID: null,
        pricingAdjustmentRequested: false,
        
        updatedDate: null,
        
        specialRequests: null,
        preNotesToClient: null,
        postNotesToClient: null,
        preNotesToSelf: null,
        postNotesToSelf: null,
        
        reviewedByServiceProfessional: false,
        reviewedByClient: false,
        
        pricingSummary: new PricingSummary(),
        serviceAddress: {
            Model: Address
        },
        serviceDate: {
            Model: EventDates
        },
        alternativeDate1: {
            Model: EventDates
        },
        alternativeDate2: {
            Model: EventDates
        },
        userJobTitle: {
            Model: PublicUserJobTitle
        }
    }, values);
    
    this.canBeCancelledByServiceProfessional = ko.pureComputed(function() {
        return (
            this.bookingStatusID() === Booking.status.confirmed &&
            this.bookingTypeID() === Booking.type.serviceProfessionalBooking
        );
    }, this);
    
    this.canBeCancelledByClient = ko.pureComputed(function() {
        return (
            (this.bookingStatusID() === Booking.status.confirmed ||
            this.bookingStatusID() === Booking.status.request) &&
            this.bookingTypeID() !== Booking.type.serviceProfessionalBooking
        );
    }, this);
    
    this.canBeDeclinedByServiceProfessional = ko.pureComputed(function() {
        return (
            this.bookingStatusID() === Booking.status.request &&
            this.bookingTypeID() !== Booking.type.serviceProfessionalBooking
        );
    }, this);
    
    this.isRequest = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.request;
    }, this);
}

module.exports = Booking;

Booking.from = function from(data) {
    if (Array.isArray(data)) {
        return data.map(Booking.from);
    }
    else {
        return new Booking(data);
    }
};

Booking.status = {
    incomplete: 1,
    request: 2,
    cancelled: 3,
    denied: 4,
    requestExpired: 5,
    confirmed: 6,
    servicePerformed: 7,
    completed: 8,
    dispute: 9
};

Booking.type = {
    marketplaceBooking: 1,
    bookNowBooking: 2,
    serviceProfessionalBooking: 3,
    exchangeBooking: 4,
    partnerBooking: 5
};
