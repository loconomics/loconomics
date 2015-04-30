/**
**/
'use strict';

var Model = require('./Model'),
    PricingEstimate = require('./PricingEstimate');

module.exports = function BookingRequest(values) {
    
    Model(this);

    this.model.defProperties({
        bookingRequestID: 0,
        bookingTypeID: 0,
        customerUserID: 0,
        freelancerUserID: 0,
        jobTitleID: 0,
        pricingEstimateID: 0,
        bookingRequestStatusID: 0,
        
        specialRequests: null,
        preferredDateID: null,
        alternativeDate1ID: null,
        alternativeDate2ID: null,
        addressID: null,
        cancellationPolicyID: null,
        instantBooking: false,
        
        createdDate: null,
        updatedDate: null,
        
        pricingEstimate: new PricingEstimate()
    }, values);
};
