'use strict';

var ko = require('knockout');
var BaseClientBookingCardVM = require('../viewmodels/BaseClientBookingCardVM');

function EditClientBookingCardVM(app) {
    
    // Base Class:
    BaseClientBookingCardVM.call(this, app);
    
    ///
    /// Data properties
    this.editedVersion = ko.observable(null);
    /// States
    this.isLoadingBooking = ko.observable(false);
    
    ///
    /// States
    var baseIsLoading = this.isLoading;
    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingBooking() ||
            baseIsLoading()
        );
    }, this);
    this.isEditMode = ko.pureComputed(function() {
        return !!this.editedVersion();
    }, this);
    // TODO computed permisions
    this.canEditLocation = ko.observable(false);
    this.canChangePricing = ko.observable(false);
    
    ///
    /// Reset
    var baseReset = this.reset;
    this.reset = function reset() {
        baseReset();

        this.editedVersion(null);

        this.isLoadingBooking(false);
    }.bind(this);
    
    /// Text helpers
    this.submitText = ko.pureComputed(function() {
        var v = this.editedVersion();
        return (
            this.isLoading() ? 
                'Loading...' : 
                this.isSaving() ? 
                    'Saving changes' : 
                    v && v.areDifferent() ?
                        'Save changes'
                        : 'Saved'
        );
    }, this);
    
    ///
    /// Edition
    this.pickDateTime = function() {
        //this.goStep('selectTimes');
    };
    this.pickLocation = function() {
        //this.goStep('selectLocation');
    };
    this.pickService = function() {
        //this.goStep('services');
    };
    
    this.confirmCancel = function() {
        var v = this.editedVersion();
        if (v && v.areDifferent()) {
            app.modals.confirm({
                title: 'Cancel',
                message: 'Are you sure?',
                yes: 'Yes',
                no: 'No'
            })
            .then(function() {
                // Confirmed cancellation:
                this.cancel();
            }.bind(this));
        }
        else {
            this.cancel();
        }
    };
    this.confirmCancelBookingByClient = function() {
        app.modals.confirm({
            title: 'Cancel booking',
            message: 'Are you sure?',
            yes: 'Yes',
            no: 'No'
        })
        .then(function() {
            // Confirmed:
            this.cancelBookingByClient();
        }.bind(this));
    };

    ///
    /// Load Booking data
    this.load = function(bookingID) {

        this.isLoadingBooking(true);
        
        app.model.bookings.getBooking(bookingID).then(function(bookingData) {
            this.booking.model.updateWith(bookingData, true);
            this.summary.firstTimeServiceFeeFixed(bookingData.pricingSummary.firstTimeServiceFeeFixed);
            this.summary.firstTimeServiceFeePercentage(bookingData.pricingSummary.firstTimeServiceFeePercentage);
            this.summary.firstTimeServiceFeeMaximum(bookingData.pricingSummary.firstTimeServiceFeeMaximum);
            this.summary.firstTimeServiceFeeMinimum(bookingData.pricingSummary.firstTimeServiceFeeMinimum);
            this.isLoadingBooking(false);
        }.bind(this))
        .catch(function(err) {
            this.isLoadingBooking(false);
            app.modals.showError({ error: err });
        }.bind(this));
    }.bind(this);
    
    var ModelVersion = require('../utils/ModelVersion');
    
    ///
    /// Edit
    this.edit = function edit() {
        if (this.isLocked()) return;

        // Create and set a version to be edited
        var version = new ModelVersion(this.booking);
        this.editedVersion(version);

    }.bind(this);
    
    this.cancel = function cancel() {
        if (this.isLocked()) return;

        if (this.editedVersion()) {
            // Discard previous version
            // NOTE: using push here since we use the original in the view editor
            // rather than the version copy
            this.editedVersion().push({ evenIfObsolete: true });
        }
        // Out of edit mode
        this.editedVersion(null);
    }.bind(this);

    /// Save helpers
    // For booking cancel/decline/confirm.
    var afterSaveBooking = function(serverBooking) {
        this.booking.model.updateWith(serverBooking, true);
        var version = this.editedVersion();
        if (version) {
            // NOTE: using pull here since we use the original in the view editor
            // rather than the version copy
            version.pull({ evenIfNewer: true });

            // Go out edit mode
            this.editedVersion(null);
        }

        this.isSaving(false);

        // Forget availability cache for this professional, since is not needed
        // and any new booking with it needs a refresh to avoid problems. See #905
        app.model.availability.clearUserCache(this.booking.serviceProfessionalUserID());
    }.bind(this);
    
    ///
    /// Save
    this.save = function() {
        // Final step, confirm and save booking
        this.isSaving(true);

        app.model.bookings.setClientBooking(this.booking)
        .then(afterSaveBooking)
        .catch(function(err) {
            this.isSaving(false);
            app.modals.showError({ error: err });
        }.bind(this));
    }.bind(this);
    
    ///
    /// Cancel Booking
    this.cancelBookingByClient = function() {
        if (!this.item().canBeCancelledByClient()) return;
        this.isSaving(true);
        app.model.bookings.cancelBookingByClient(this.booking.bookingID())
        .then(afterSaveBooking)
        .catch(function(err) {
            // The version data keeps untouched, user may want to retry
            // or made changes on its un-saved data.
            // Show error
            app.modals.showError({
                title: 'There was an error saving the data.',
                error: err
            });
            // Don't replicate error, allow always
        })
        .then(function() {
            // ALWAYS:
            this.isSaving(false);
        }.bind(this));
    };
}
EditClientBookingCardVM._inherits(BaseClientBookingCardVM);

module.exports = EditClientBookingCardVM;
