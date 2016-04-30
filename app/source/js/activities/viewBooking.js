/**
    ViewBooking activity
    
    It manages links to booking card given at emails.
    Because the app has different URLs for client and professional profiles,
    and sometimes the same URL needs to be provided, this behaves as the common URL
    for both that redirects to any specific depending on the booking data.
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function ViewBookingActivity() {
    
    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    var bookingID = state && state.route.segments && state.route.segments[0];
    var currentUserID = this.app.model.userProfile.data.userID();
    this.app.model.bookings.getBooking(bookingID)
    .then(function(booking) {
        if (booking.serviceProfessionalUserID === currentUserID) {
            this.app.shell.go('/appointment/' + booking.serviceDateID);
        }
        else {
            this.app.shell.go('/clientAppointment/' + bookingID);
        }
    }.bind(this));
};
