/** ClientAppointmentCard view model.
    It provides data and method to visualize and 
    edit and appointment card, with booking, event
    or placeholder information
**/

var ko = require('knockout'),
    moment = require('moment'),
    getObservable = require('../utils/getObservable'),
    Booking = require('../models/Booking'),
    ModelVersion = require('../utils/ModelVersion');
var Booking = require('../models/Booking');

// TODO Booking, or extension, needs:
// - method getServiceDurationMinutes

function ClientAppointmentCardVM(params) {
    /*jshint maxstatements: 60*/

    this.sourceItem = getObservable(params.sourceItem);
    var app = this.app = ko.unwrap(params.app);
    
    this.item = ko.observable(this.sourceItem());

    this.editMode = getObservable(params.editMode);
    this.editedVersion = ko.observable(null);
    
    this.isSaving = ko.observable(false);
    this.isLoading = getObservable(params.isLoading);
    this.isLocked = ko.computed(function() {
        return this.isSaving() || this.isLoading();
    }, this);
    
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

    /**
        If the sourceItem changes, is set as the item value
        discarding any model version and reverting
        editMode to false
    **/
    this.sourceItem.subscribe(function(sourceItem) {
        this.item(sourceItem);
        this.editedVersion(null);
        this.editMode(false);

        // If the new item is a new one, set edit mode
        if (this.isNew()) {
            this.editMode(true);
        }
    }, this);

    /**
        Enter and finish edit:
        Create version and save data
    **/
    this.editMode.subscribe(function(isEdit) {
        if (isEdit) {
            // Create and set a version to be edited
            var version = new ModelVersion(this.sourceItem());
            this.editedVersion(version);
            this.item(version.version);
        }
        else {
            this.item(this.sourceItem());
        }
    }, this);

    this.edit = function edit() {
        if (this.isLocked()) return;

        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);
    
    var afterSave = function afterSave(savedApt) {
        var version = this.editedVersion();
        // Do not do a version push, just update with remote
        //version.push({ evenIfObsolete: true });
        // Update with remote data, the original appointment in the version,
        // not the currentAppointment or in the index in the list to avoid
        // race-conditions
        version.original.model.updateWith(savedApt, true);
        // Do a pull so original and version gets the exact same data
        version.pull({ evenIfNewer: true });

        // Go out edit mode
        this.editMode(false);

        // Notify
        var msg = this.item().serviceProfessional().firstName() + ' will receive an e-mail confirmation.';
        app.modals.showNotification({
            title: 'Confirmed!',
            message: msg
        });
    }.bind(this);

    this.save = function save() {
        if (this.isLocked()) return;

        // There is a version? Push changes!
        var version = this.editedVersion();

        if (version && version.areDifferent()) {
            this.isSaving(true);
            app.model.bookings.setClientBooking(version.version)
            .then(afterSave)
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
        }
    }.bind(this);

    this.cancel = function cancel() {
        if (this.isLocked()) return;

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editMode(false);
    }.bind(this);
    
    this.confirmCancel = function confirmCancel() {
        this.app.modals.confirm({
            title: 'Cancel',
            message: 'Are you sure?',
            yes: 'Yes',
            no: 'No'
        })
        .then(function() {
            // Confirmed cancellation:
            this.cancel();
        }.bind(this));
    }.bind(this);

    /**
        Special updates and related flags
    **/
    // IMPORTANT Editing rule
    // TODO Must go into Booking model, I think???
    this.canChangePricing = ko.pureComputed(function() {
        var b = this.item();
        if (b) {
            var bt = b.bookingTypeID();
            return (
                bt === Booking.type.serviceProfessionalBooking || (
                    bt === Booking.type.bookNowBooking &&
                    !b.paymentCollected
                )
            );
        }
        return false;
    }, this);

    // For booking cancel/decline/confirm.
    var afterSaveBooking = function(booking) {
        var version = this.editedVersion();
        if (version) {
            version.original.sourceBooking(booking);
            version.pull({ evenIfNewer: true });

            // Go out edit mode
            this.editMode(false);
        }
        else {
            this.sourceItem().sourceBooking(booking);
        }
        
        var msg = this.item().client().firstName() + ' will receive an e-mail confirmation.';

        app.modals.showNotification({
            title: 'Done!',
            message: msg
        });
    }.bind(this);

    this.cancelBookingByClient = function() {
        if (!this.item().canBeCancelledByClient()) return;
        this.isSaving(true);
        app.model.bookings.cancelBookingByClient(this.item().bookingID())
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
    
    this.confirmCancelBookingByClient = function() {
        this.app.modals.confirm({
            title: 'Cancel booking',
            message: 'Are you sure?',
            yes: 'Yes',
            no: 'No'
        })
        .then(function() {
            // Confirmed:
            this.cancelBookingByClient();
        }.bind(this));
    }.bind(this);
    
    /**
        External actions
    **/
    var editFieldOn = function editFieldOn(activity, data) {

        // Include appointment to recover state on return:
        data.appointment = this.item().model.toPlainObject(true);
        
        data.cancelLink = this.cancelLink;

        app.shell.go(activity, data);
    }.bind(this);

    this.pickDateTime = function pickDateTime() {
        if (this.isLocked()) return;

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().serviceDate().startTime(),
            datetimeField: 'startTime',
            headerText: 'Select the start time',
            requiredDuration: this.item().getServiceDurationMinutes()
        });
    }.bind(this);

    this.pickEndDateTime = function pickEndDateTime() {
        if (this.isLocked()) return;

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().serviceDate().endTime(),
            datetimeField: 'endTime',
            headerText: 'Select the end time',
            includeEndTime: true
        });
    }.bind(this);

    this.pickService = function pickService() {
        if (this.isLocked()) return;

        editFieldOn('serviceProfessionalService/' + this.item().jobTitleID(), {
            selectPricing: true,
            selectedServices: this.item().pricing()
            .map(function(pricing) {
                return {
                    serviceProfessionalServiceID: ko.unwrap(pricing.serviceProfessionalServiceID),
                    price: ko.unwrap(pricing.price)
                };
            })
        });
    }.bind(this);

    this.pickLocation = function pickLocation() {
        if (this.isLocked()) return;

        editFieldOn('serviceAddresses/' + this.item().jobTitleID(), {
            selectAddress: true,
            selectedAddressID: this.item().addressID()
        });
    }.bind(this);

    var textFieldsHeaders = {
        preNotesToClient: 'Notes to client',
        postNotesToClient: 'Notes to client (afterwards)',
        preNotesToSelf: 'Notes to self',
        postNotesToSelf: 'Booking summary',
        summary: 'What?'
    };

    this.editTextField = function editTextField(field) {
        if (this.isLocked()) return;

        editFieldOn('textEditor', {
            request: 'textEditor',
            field: field,
            title: this.isNew() ? 'New booking' : 'Booking',
            header: textFieldsHeaders[field],
            text: this.item()[field]()
        });
    }.bind(this);
    
    // pass this ready model view as an API to the outside
    if (typeof(params.api) === 'function') {
        params.api(this);
    }
    
    // Calculate the endTime given an appointment duration, retrieved
    // from the selected service
    ko.computed(function calculateEndTime() {
        var duration = this.item().serviceDurationMinutes(),
            start = moment(this.item().startTime()),
            end;

        if (this.isBooking() &&
            start.isValid()) {
            end = start.add(duration, 'minutes').toDate();
            this.item().endTime(end);
        }
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

module.exports = ClientAppointmentCardVM;
