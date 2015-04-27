/** Booking model.

    Describes a booking with related BookingRequest 
    and PricingEstimate objects.
 **/
'use strict';

var Model = require('./Model'),
    BookingRequest = require('./BookingRequest');

function Booking(values) {
    
    Model(this);

    this.model.defProperties({
        bookingID: 0,
        bookingRequestID: 0,
        confirmedDateID: null,
        totalPricePaidByCustomer: null,
        totalServiceFeesPaidByCustomer: null,
        totalPaidToFreelancer: null,
        totalServiceFeesPaidByFreelancer: null,
        bookingStatusID: null,
        pricingAdjustmentApplied: false,
        
        preNotesToClient: null,
        postNotesToClient: null,
        preNotesToSelf: null,
        postNotesToSelf: null,
        
        reviewedByFreelancer: false,
        reviewedByCustomer: false,
        
        createdDate: null,
        updatedDate: null,
        
        bookingRequest: null // BookingRequest
    }, values);
    
    this.bookingRequest(new BookingRequest(values && values.bookingRequest || {}));
}

module.exports = Booking;
