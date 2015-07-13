/** AppointmentCard view model.
    It provides data and method to visualize and 
    edit and appointment card, with booking, event
    or placeholder information
**/

var ko = require('knockout'),
    moment = require('moment'),
    getObservable = require('../utils/getObservable'),
    Appointment = require('../models/Appointment'),
    AppointmentView = require('../viewmodels/AppointmentView'),
    ModelVersion = require('../utils/ModelVersion'),
    getDateWithoutTime = require('../utils/getDateWithoutTime'),
    PricingEstimateDetail = require('../models/PricingEstimateDetail');

function AppointmentCardViewModel(params) {
    /*jshint maxstatements: 40*/

    this.sourceItem = getObservable(params.sourceItem);
    var app = this.app = ko.unwrap(params.app);

    this.editMode = getObservable(params.editMode);
    this.editedVersion = ko.observable(null);
    
    this.isSaving = ko.observable(false);
    this.isLoading = getObservable(params.isLoading);
    this.isLocked = ko.computed(function() {
        return this.isSaving() || this.isLoading();
    }, this);
    
    this.item = ko.observable(AppointmentView(this.sourceItem(), app));
    
    this.currentID = ko.pureComputed(function() {
        var it = this.item();
        return it && it.id() || 0;
    }, this);
    
    this.currentDate = ko.pureComputed(function() {
        return getDateWithoutTime(this.item() && this.item().startTime());
    }, this);
    
    this.isNew = ko.computed(function() {
        var id = this.currentID();
        return id === -3 || id === -4;
    }, this);
    
    this.isBooking = ko.computed(function() {
        return this.item() && this.item().sourceBooking();
    }, this);
    
    /* Return true if is an event object but not a booking */
    this.isEvent = ko.computed(function() {
        return this.item() && this.item().sourceEvent() && !this.item().sourceBooking();
    }, this);
    
    this.headerClass = ko.pureComputed(function() {
        return (
            this.isBooking() ? 'Card-title--primary' :
            this.isEvent() ? 'Card-title--danger' :
            ''
        );
    }, this);
    
    this.newAppointmentVisible = ko.pureComputed(function() {
        var id = this.currentID();
        return id === Appointment.specialIds.free || id === Appointment.specialIds.emptyDate || id === Appointment.specialIds.unavailable;
    }, this);
    
    this.editScheduleVisible = ko.pureComputed(function() {
        return this.currentID() === Appointment.specialIds.unavailable;
    }, this);
    
    this.submitText = ko.pureComputed(function() {
        var v = this.editedVersion();
        return (
            this.isLoading() ? 
                'Loading...' : 
                this.isSaving() ? 
                    'Saving changes' : 
                    v && v.areDifferent() ?
                        this.isNew() && this.isBooking() ?
                            'Book' :
                            'Save'
                        : 'Saved'
        );
    }, this);

    /**
        If the sourceItem changes, is set as the item value
        discarding any model version and reverting
        editMode to false
    **/
    this.sourceItem.subscribe(function(sourceItem) {
        this.item(AppointmentView(sourceItem, app));
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
        if (this.currentID() <= 0 && !this.isNew()) {
            return;
        }
        if (isEdit) {
            // Create and set a version to be edited
            var version = new ModelVersion(this.sourceItem());
            version.version.sourceEvent(this.sourceItem().sourceEvent());
            version.version.sourceBooking(this.sourceItem().sourceBooking());
            this.editedVersion(version);
            this.item(AppointmentView(version.version, app));
            
            if (this.isNew() && this.isEvent()) {
                // Some defaults for events
                this.item().sourceEvent().availabilityTypeID(0); // Unavailable
                this.item().isAllDay(false);
                this.item().sourceEvent().eventTypeID(3); // Appointment/block-time
                this.item().summary('');
            }
        }
        else {
            this.item(AppointmentView(this.sourceItem(), app));
        }
    }, this);

    this.edit = function edit() {
        if (this.isLocked()) return;

        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);
    
    this.save = function save() {
        if (this.isLocked()) return;

        // There is a version? Push changes!
        var version = this.editedVersion();

        if (version && version.areDifferent()) {
            this.isSaving(true);
            app.model.calendar.setAppointment(version.version)
            .then(function(savedApt) {
                // Do not do a version push, just update with remote
                //version.push({ evenIfObsolete: true });
                // Update with remote data, the original appointment in the version,
                // not the currentAppointment or in the index in the list to avoid
                // race-conditions
                console.log('SAVED APT', savedApt.id(), version.original.id(), version.version.id());
                version.original.model.updateWith(savedApt);
                // Do a pull so original and version gets the exact same data
                version.pull({ evenIfNewer: true });

                // Go out edit mode
                this.editMode(false);
                
                // Notify
                if (this.isBooking()) {
                    
                    var msg = this.item().customer().firstName() + ' will receive an e-mail confirmation.';
                    
                    app.modals.showNotification({
                        title: 'Confirmed!',
                        message: msg
                    });
                }
                
            }.bind(this))
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

    /**
        External actions
    **/
    var editFieldOn = function editFieldOn(activity, data) {

        // Include appointment to recover state on return:
        data.appointment = this.item().model.toPlainObject(true);
        
        data.cancelLink = this.cancelLink;
        
        if (this.progress &&
            !this.progress.ended) {
            data.progress = this.progress;
            var step = data.progress.step || 1,
                total = data.progress.total || 1;
            // TODO I18N
            data.title = step + ' of ' + total;
            data.navTitle = null;
        } else {
            // keep data.progress so it does not restart the process after
            // an edition. The passIn already resets that on new calls
            data.progress = this.progress;
            // Edition title:
            data.title = null;
            data.navTitle = this.isBooking() ? 'Booking' : 'Event';
        }

        app.shell.go(activity, data);
    }.bind(this);

    this.pickDateTime = function pickDateTime() {
        if (this.isLocked()) return;

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().startTime(),
            datetimeField: 'startTime',
            headerText: 'Select the start time',
            requiredDuration: this.item().serviceDurationMinutes()
        });
    }.bind(this);

    this.pickEndDateTime = function pickEndDateTime() {
        if (this.isLocked()) return;

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().endTime(),
            datetimeField: 'endTime',
            headerText: 'Select the end time'
        });
    }.bind(this);

    this.pickClient = function pickClient() {
        if (this.isLocked()) return;

        editFieldOn('clients', {
            selectClient: true,
            selectedClientID: this.item().sourceBooking().bookingRequest().customerUserID()
        });
    }.bind(this);

    this.pickService = function pickService() {
        if (this.isLocked()) return;

        editFieldOn('freelancerPricing/' + this.item().jobTitleID(), {
            selectPricing: true,
            selectedPricing: this.item().pricing()
            .map(function(pricing) {
                return {
                    freelancerPricingID: ko.unwrap(pricing.freelancerPricingID),
                    totalPrice: ko.unwrap(pricing.totalPrice)
                };
            })
        });
    }.bind(this);

    this.changePrice = function changePrice() {
        if (this.isLocked()) return;
        // TODO
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

/**
    It manages incoming data provided by external activities given
    the requestData received by the activity hosting this view instance.
    Used to manage the data returned by calls to edit data in
    external activities.
**/
AppointmentCardViewModel.prototype.passIn = function passIn(requestData) {
    /*jshint maxcomplexity:20,maxstatements:40 */
    
    // If the request includes an appointment plain object, that's an
    // in-editing appointment so put it in place (to restore a previous edition)
    if (requestData.appointment) {
        // Set the edit mode (it performs any required
        // set-up if we are not still in edit mode).
        this.editMode(true);
        // Sets the data
        this.item()
        .model.updateWith(requestData.appointment);
    }
    else if (!this.isNew()) {
        // On any other case, and to prevent a bad editMode state,
        // set off edit mode discarding unsaved data:
        this.cancel();
    }

    /// Manage specific single data from externally provided
    
    // It comes back from the textEditor.
    if (requestData.request === 'textEditor') {
        this.item()[requestData.field](requestData.text);
    }
    if (requestData.selectClient === true) {
        this.item().customerUserID(requestData.selectedClientID);
    }
    if (typeof(requestData.selectedDatetime) !== 'undefined') {
        var field = requestData.datetimeField;
        this.item()[field](requestData.selectedDatetime);
    }
    if (requestData.selectedJobTitleID) {
        this.item().jobTitleID(requestData.selectedJobTitleID);
    }
    if (requestData.selectAddress === true) {
        this.item().addressID(requestData.selectedAddressID);
    }
    if (requestData.selectPricing === true) {
        this.item().pricing(
            requestData.selectedPricing.map(function(pricing) {
                return new PricingEstimateDetail(pricing);
            })
        );
    }
    
    if (this.isNew()) {
        if (requestData && requestData.cancelLink) {
            this.cancelLink = requestData.cancelLink;
        }
        else {
            // Using the Referrer URL as the link when cancelling the task
            var referrerUrl = this.app.shell.referrerRoute;
            referrerUrl = referrerUrl && referrerUrl.url || 'calendar';

            this.cancelLink = referrerUrl;
        }
    }

    // Special behavior for adding a booking: it requires a guided creation
    // through a progress path
    if (this.currentID() === Appointment.specialIds.newBooking) {
        if (!requestData.progress) {
            // Start!
            this.progress = {
                step: 1,
                total: 4,
                ended: false
            };
            // First step
            this.pickClient(); //._delayed(50)();
        }
        else if (requestData.progress) {
            this.progress = requestData.progress;
            var step = this.progress.step || 1;
            if (step < 2) {
                // Second step
                this.progress.step = 2;
                this.pickService();//._delayed(50)();
            }
            else if (step < 3) {
                // Thrid step
                requestData.progress.step = 3;
                this.pickDateTime();//._delayed(50)();
            }
            else if (step < 4) {
                requestData.progress.step = 4;
                this.pickLocation();//._delayed(50)();
            }
            else {
                // Steps finished, not it enters in revision mode before
                // finally save/create the booking, but remove the progress info
                // to avoid problems editing fields.
                this.progress.ended = true;
            }
        }
    } else {
        // Reset progress
        this.progress = null;
    }
};


module.exports = AppointmentCardViewModel;
