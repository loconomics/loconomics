'use strict';

var BaseClientBookingCardVM = require('../viewmodels/BaseClientBookingCardVM');

function EditClientBookingCardVM(app) {
    ///
    /// Save REVIEW
    this.save = function() {
        // Final step, confirm and save booking
        this.isSaving(true);
        
        // Prepare tasks (callbacks)
        // save promise:
        var saveIt = function() {
            var requestOptions = {
                promotionalCode: this.promotionalCode(),
                bookCode: this.bookCode()
            };
            return app.model.bookings.requestClientBooking(this.booking, requestOptions, this.paymentMethod());    
        }.bind(this);
        // success promise:
        var success = function(serverBooking) {
            this.isSaving(false);
            this.booking.model.updateWith(serverBooking);
            
            // Forget availability cache for this professional, since is not needed
            // and any new booking with it needs a refresh to avoid problems. See #905
            app.model.availability.clearUserCache(this.booking.serviceProfessionalUserID());
            this.isDone(true);
        }.bind(this);
        // error handling
        var onerror = function(err) {
            this.isSaving(false);
            app.modals.showError({ error: err });
        }.bind(this);

        saveIt()
        .then(success)
        .catch(onerror);
    }.bind(this);
}
EditClientBookingCardVM._inherits(BaseClientBookingCardVM);

module.exports = EditClientBookingCardVM;
