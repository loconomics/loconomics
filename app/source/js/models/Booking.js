/** Booking model.

    Describes a booking and related data,
    mainly the pricing summary and details, but
    can hold other related data if optionally loaded
    (address, dates, publicUserJobTitle)
 **/
'use strict';

var ko = require('knockout');
var Model = require('./Model');
var PricingSummary = require('./PricingSummary');
var PublicUserJobTitle = require('./PublicUserJobTitle');
var Address = require('./Address');
var moment = require('moment');
var EventDates = require('./EventDates');

// I18N See not below where used
var statusLabels = {
    incomplete: 'This booking was never completed',
    request: 'Booking request not yet confirmed',
    cancelled: 'This booking has been cancelled',
    denied: 'This booking has been cancelled',
    requestExpired: 'This booking request expired',
    confirmed: 'This booking is confirmed',
    servicePerformed: 'Services have been performed',
    completed: 'This booking has been completed',
    dispute: "We'll be in touch shortly"
};
var Enum = require('../utils/Enum');

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
        paymentAuthorized: false,
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
    
    this.isConfirmed = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.confirmed;
    }, this);
    
    this.isCompleted = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.completed;
    }, this);
    
    this.isIncomplete = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.incomplete;
    }, this);
    
    this.isPerformed = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.servicePerformed;
    }, this);    
    
    this.isDispute = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.dispute;
    }, this);
    
    this.isCancelled = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.cancelled;
    }, this);
    
    this.isDenied = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.denied;
    }, this);
    
    this.isExpired = ko.pureComputed(function() {
        return this.bookingStatusID() === Booking.status.requestExpired;
    }, this);
    
    /**
        It communicates when the booking is at a final state in its life-cycle, so it keeps closed
    **/
    var finalStatuses = [Booking.status.cancelled, Booking.status.denied, Booking.status.requestExpired, Booking.status.completed];
    this.isClosed = ko.pureComputed(function() {
        return finalStatuses.indexOf(this.bookingStatusID()) > -1;
    }, this);
    
    this.isServiceProfessionalBooking = ko.pureComputed(function() {
        return this.bookingTypeID() === Booking.type.serviceProfessionalBooking;
    }, this);
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        return moment(this.serviceDate().startTime()).locale('en-US-LC').calendar();
    }, this);
    
    this.displayedStartTime = ko.pureComputed(function() {
        return moment(this.serviceDate().startTime()).locale('en-US-LC').format('LT');
    }, this);
    
    this.displayedEndTime = ko.pureComputed(function() {
        return moment(this.serviceDate().endTime()).locale('en-US-LC').format('LT');
    }, this);
    
    // TODO Can/must be removed this shortcut?
    this.servicesSummary = ko.pureComputed(function() {
        return this.pricingSummary().servicesSummary();
    }, this);
    
    this.displayPaymentAuthorizedLabel = ko.pureComputed(function() {
        return this.paymentAuthorized() && !this.isCompleted();
    }, this);
    this.displayPaymentCollectedLabel = ko.pureComputed(function() {
        return this.paymentCollected() && !this.paymentAuthorized();
    }, this);
    this.displayPaymentPaidLabel = ko.pureComputed(function() {
        return this.paymentEnabled() && this.isCompleted();
    }, this);
    
    /// Visible status label
    /// L18N: Move the labels object to a locale ressources file
    this.bookingStatusLabel = ko.pureComputed(function() {
        var n = Enum.name(Booking.status, this.bookingStatusID());
        return statusLabels[n] || '';
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
