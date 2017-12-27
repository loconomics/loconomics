'use strict';

var ko = require('knockout');
var BaseClientBookingCardVM = require('../viewmodels/BaseClientBookingCardVM');
var bookings = require('../data/bookings');
var availability = require('../data/availability');
var showNotification = require('../modals/notification').show;
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;

function EditClientBookingCardVM(app) {

    // Base Class:
    BaseClientBookingCardVM.call(this, app);

    ///
    /// Data properties
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

    ///
    /// Reset
    var baseReset = this.reset;
    this.reset = function reset() {
        baseReset();

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
    var baseCancel = this.cancel.bind(this);
    this.cancel = function cancel() {
        baseCancel();
        this.progress.go('confirm');
    }.bind(this);

    this.confirmCancel = function() {
        var v = this.editedVersion();
        if (v && v.areDifferent()) {
            showConfirm({
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
        showConfirm({
            title: 'Cancel booking',
            message: 'Are you sure? Cancellation fees may apply.',
            yes: 'Yes',
            no: 'No'
        })
        .then(function() {
            // Confirmed:
            this.cancelBookingByClient();
        }.bind(this));
    }.bind(this);

    ///
    /// Load Booking data
    this.load = function(bookingIdOrModel) {
        if (bookingIdOrModel && bookingIdOrModel.model) {
            // Use model as original data
            this.originalBooking(bookingIdOrModel);
            this.progress.reset().go('confirm');
            return Promise.resolve();
        }
        else {
            // Load by ID
            var bookingID = bookingIdOrModel |0;
            this.isLoadingBooking(true);
            return bookings.getBooking(bookingID).then(function(booking) {
                this.originalBooking(booking);
                this.progress.reset().go('confirm');
                this.isLoadingBooking(false);
            }.bind(this))
            .catch(function(err) {
                this.isLoadingBooking(false);
                showError({ error: err });
            }.bind(this));
        }
    }.bind(this);

    /// Save helpers
    // For booking cancel/decline/confirm.
    var afterSaveBooking = function(serverBooking) {
        this.originalBooking().model.updateWith(serverBooking, true);
        var version = this.editedVersion();
        if (version) {
            // IMPORTANT: we do not need to push changes from version to original, since
            // we already are updating the originalBooking with server-updated data
            //version.push({ evenIfObsolete: true });
            // Go out edit mode
            this.editedVersion(null);
        }
        this.isCancelMode(false);

        var msg = 'You\'re all set! We\'ll notify {0} of your changes.'.replace('{0}', this.serviceProfessionalInfo().profile().firstName());

        showNotification({
            title: 'Done!',
            message: msg
        });

        this.isSaving(false);

        // Forget availability cache for this professional, since is not needed
        // and any new booking with it needs a refresh to avoid problems. See #905
        availability.clearUserCache(this.originalBooking().serviceProfessionalUserID());
    }.bind(this);

    ///
    /// Save
    this.save = function() {
        // Final step, confirm and save booking
        this.isSaving(true);

        bookings.setClientBooking(this.booking())
        .then(afterSaveBooking)
        .catch(function(err) {
            this.isSaving(false);
            showError({ error: err });
        }.bind(this));
    }.bind(this);

    ///
    /// Cancel Booking
    this.cancelBookingByClient = function() {
        if (!this.canCancel()) return;
        this.isSaving(true);
        var apiCall = this.booking().canBeCancelledByClient() ?
            bookings.cancelBookingByClient :
            bookings.declineBookingByClient
        ;
        apiCall(this.booking().bookingID())
        .then(afterSaveBooking)
        .catch(function(err) {
            // The version data keeps untouched, user may want to retry
            // or made changes on its un-saved data.
            // Show error
            showError({
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
