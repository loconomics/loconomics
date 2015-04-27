/** AppointmentCard view model.
    It provides data and method to visualize and 
    edit and appointment card, with booking, event
    or placeholder information
**/

var ko = require('knockout'),
    getObservable = require('../utils/getObservable'),
    AppointmentView = require('../viewmodels/AppointmentView'),
    ModelVersion = require('../utils/ModelVersion'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');

function AppointmentCardViewModel(params) {

    this.sourceItem = getObservable(params.sourceItem);
    var app = this.app = ko.unwrap(params.app);

    this.editMode = getObservable(params.editMode);
    this.editedVersion = ko.observable(null);
    
    this.isSaving = ko.observable(false);
    
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
        if (this.currentID() <= 0) {
            return;
        }

        var version;

        if (isEdit) {
            // Create and set a version to be edited
            version = new ModelVersion(this.sourceItem());
            version.version.sourceEvent(this.sourceItem().sourceEvent());
            version.version.sourceBooking(this.sourceItem().sourceBooking());
            this.editedVersion(version);
            this.item(AppointmentView(version.version, app));

            // Setup auto-saving
            version.on('push', function(success) {
                if (success) {
                    this.isSaving(true);
                    app.model.appointments.setAppointment(version.version)
                    .then(function(savedApt) {
                        //var wasNew = version.original.id() < 1;
                        // Update with remote data, the original appointment in the version,
                        // not the currentAppointment or in the index in the list to avoid
                        // race-conditions
                        version.original.model.updateWith(savedApt);

                        // TODO: wasNew:true: add to the list and sort it??
                        // There is a wizard for bookings, so may be different on that case
                    })
                    .catch(function(err) {
                        // Show error
                        app.modals.showError({
                            title: 'There was an error saving the data.',
                            error: err && err.error || err
                        });
                        // Don't replicate error, allow always
                    })
                    .then(function() {
                        // ALWAYS:
                        this.isSaving(false);
                    });
                }
            }.bind(this));
        }
        else {
            // There is a version? Push changes!
            version = this.editedVersion();

            if (version && version.areDifferent()) {
                // Push version to original, will launch a remote update 
                // if anithing changed
                // TODO: ask for confirmation if version isObsolete
                version.push({ evenIfObsolete: true });
            }
        }
    }, this);

    this.edit = function edit() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);
    
    this.save = function save() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(false);
    }.bind(this);

    this.cancel = function cancel() {

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

        app.shell.go(activity, data);
    }.bind(this);

    this.pickDateTime = function pickDateTime() {

        editFieldOn('datetimePicker', {
            selectedDatetime: this.item().startTime()
        });
    }.bind(this);

    this.pickClient = function pickClient() {

        editFieldOn('clients', {
            selectClient: true,
            selectedClientID: this.item().sourceBooking().bookingRequest().customerUserID()
        });
    }.bind(this);

    this.pickService = function pickService() {

        editFieldOn('services', {
            selectServices: true,
            selectedServices: this.item().services()
        });
    }.bind(this);

    this.changePrice = function changePrice() {
        // TODO
    }.bind(this);

    this.pickLocation = function pickLocation() {

        editFieldOn('locations', {
            selectLocation: true,
            selectedLocation: this.item().location()
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

        editFieldOn('textEditor', {
            request: 'textEditor',
            field: field,
            title: this.isNew() ? 'New booking' : 'Booking',
            header: textFieldsHeaders[field],
            text: this.item()[field]()
        });
    }.bind(this);
}

module.exports = AppointmentCardViewModel;
