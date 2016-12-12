'use strict';

var ko = require('knockout');
var Booking = require('../models/Booking.editable');
var ServiceProfessionalServiceVM = require('../viewmodels/ServiceProfessionalService');
var ServiceAddresses = require('../viewmodels/ServiceAddresses');
var BookingProgress = require('../viewmodels/BookingProgress');
var Address = require('../models/Address');
var EventDates = require('../models/EventDates');
var PublicUser = require('../models/PublicUser');
var ModelVersion = require('../utils/ModelVersion');


// L18N
// List of all possible steps by name providing the language for the UI
var stepsLabels = {
    services: 'Services',
    selectLocation: 'Select a location',
    selectTimes: 'Select preferred times',
    selectTime: 'Select the time',
    payment: 'Payment',
    confirm: 'Confirm'
};

function BaseClientBookingCardVM(app) {
    //jshint maxstatements:100
    
    this.app = app;
    
    ///
    /// Data properties
    this.originalBooking = ko.observable(); // :Booking
    this.editedVersion = ko.observable(null); // :ModelVersion
    this.serviceProfessionalServices = new ServiceProfessionalServiceVM(app);
    this.serviceProfessionalServices.isSelectionMode(true);
    this.serviceProfessionalServices.preSelectedServices([]);
    /// Addresses
    this.serviceAddresses = new ServiceAddresses();
    this.serviceAddresses.isSelectionMode(true);
    this.isLoadingServiceAddresses = ko.observable(false);
    this.clientAddresses = new ServiceAddresses();
    this.clientAddresses.isSelectionMode(true);
    this.addressEditorOpened = new ko.observable(false);
    /// Gratuity
    this.supportsGratuity = ko.observable(false);
    this.presetGratuity = ko.observable(0);
    this.gratuityAmount = ko.observable(0);
    /// Date time picker(s) ViewModel:
    // IMPORTANT: Is filled by the component binding with the DatePicker VM API
    this.serviceStartDatePickerView = ko.observable(null);
    /// Date time picker(s)
    this.timeFieldToBeSelected = ko.observable('');
    /// Progress management
    // Se inicializa con un estado previo al primer paso
    // (necesario para el manejo de reset y preparación del activity)
    this.progress = new BookingProgress({ step: -1 });

    /// States (other states are computed)
    this.isSaving = ko.observable(false);
    this.isCancelMode = ko.observable(false);

    ///
    /// URLs (constants, don't need reset)
    var siteUrl = (app.model.config.siteUrl || 'https://loconomics.com') + '/';
    this.urlTos = ko.observable(siteUrl + '#!terms/terms-of-service?mustReturn=true');
    this.urlPp = ko.observable(siteUrl + '#!terms/privacy-policy?mustReturn=true');
    this.urlBcp = ko.observable(siteUrl + '#!terms/background-check-policy?mustReturn=true');
    // this.urlCp defined as computed later (depends upon other observables)

    ///
    // List of possible error messages registered by name
    this.errorMessages = {
        postalCode: ko.observable('')
    };
    
    
    ///
    /// Reset
    this.reset = function reset() {
        this.originalBooking(null);
        this.editedVersion(null);
        
        this.serviceProfessionalServices.reset();
        this.serviceProfessionalServices.isSelectionMode(true);
        this.serviceProfessionalServices.preSelectedServices([]);

        this.serviceAddresses.reset();
        this.serviceAddresses.isSelectionMode(true);
        this.isLoadingServiceAddresses(false);
        this.clientAddresses.reset();
        this.clientAddresses.isSelectionMode(true);
        this.addressEditorOpened(false);
        
        this.supportsGratuity(false);
        this.presetGratuity(0);
        this.gratuityAmount(0);
        
        // NEVER RESET this.serviceStartDatePickerView IT'S A VW API
        
        this.timeFieldToBeSelected('');
        this.isSaving(false);
        this.isCancelMode(false);
        this.progress.reset();
        
        this.errorMessages.postalCode('');
    }.bind(this);
    
    /// 
    /// Computed states
    this.isEditMode = ko.pureComputed(function() {
        return !!this.editedVersion();
    }, this);
    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingServiceProfessionalInfo() ||
            this.serviceProfessionalServices.isLoading()
        );
    }, this);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);
    // Edit permissions, per client edition rules #880
    this.canEdit = ko.pureComputed(function() {
        // Not allowed in request state (only cancellation is allowed there), so just only on 'confirmed' ones
        // (other states are not valid too).
        // Allowed only for instant-booking
        if (!this.originalBooking() || !this.booking()) return false;
        return !this.booking().bookingID() || this.booking().instantBooking() && this.booking().isConfirmed();
    }, this);
    /**
        This observable abstracts the idea of 'cancellation' for clients: internally
        is either 'cancel' or 'decline', it depends on the booking type.
    **/
    this.canCancel = ko.pureComputed(function() {
        return this.originalBooking() && (
            this.originalBooking().canBeCancelledByClient() ||
            this.originalBooking().canBeDeclinedByClient()
        );
    }, this);
    this.isAnonymous = ko.pureComputed(function() {
        var u = app.model.user();
        return u && u.isAnonymous();
    });

    ///
    /// Computed observables and View Functions
    
    ///
    /// Edit
    this.edit = function edit() {
        if (this.isLocked()) return;
        
        if (this.canCancel()) {
            this.isCancelMode(true);
        }
        if (!this.canEdit()) return;

        // Create and set a version to be edited
        var version = new ModelVersion(this.originalBooking());
        // Expand edition capabilities of the booking version before being available for edition
        Booking.editable(version.version);
        version.version.connectToSelectableServicesView(this.serviceProfessionalServices);
        // Only on addresses being edited by the user, with the editor opened
        version.version.connectPostalCodeLookup(app, this.addressEditorOpened, this.errorMessages.postalCode);
        // Use the version as booking()
        this.editedVersion(version);
        // Start loading things that are needed right now
        // there are saved pricing details (booking selected services), we need to load professional services
        if (version.version.pricingSummary().details().length) {
            this.loadServices();
        }
        // there is a saved address, load service addresses
        if (version.version.serviceAddress() && version.version.serviceAddress().addressID()) {
            this.loadServiceAddresses();
        }

    }.bind(this);
    
    this.cancel = function cancel() {
        if (this.isLocked()) return;
        this.isCancelMode(false);

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editedVersion(null);
        this.progress.reset();
    }.bind(this);
    
    this.booking = ko.pureComputed(function() {
        var v = this.editedVersion();
        return v ? v.version : this.originalBooking();
    }, this);
    
    /// Gratuity
    // TODO Complete support for gratuity, server-side
    this.gratuityPercentage = ko.pureComputed(function() {
        var preset = this.presetGratuity();
        if (preset === 'custom')
            return 0;
        else
            return preset;
    }, this);

    
    // Sync: Automatic updates between dependent models:
    this.gratuityPercentage.subscribe(function(v) {
        if (this.booking()) this.booking().pricingSummary().gratuityPercentage(v);
    }, this);
    this.gratuityAmount.subscribe(function(v) {
        if (this.booking()) this.booking().pricingSummary().gratuityAmount(v);
    }, this);
    
    this.hasServicesSelected = ko.pureComputed(function() {
        var s = this.serviceProfessionalServices.selectedServices();
        return s && s.length > 0 || false;
    }, this);


    ///
    /// Service Address
    var setAddress = function(add) {
        if (!add || !this.booking()) return;
        this.booking().serviceAddress(add);
        if (!this.isRestoring || !this.isRestoring())
            this.nextStep();
    }.bind(this);
    // IMPORTANT: selection from one list must deselect from the other one
    this.serviceAddresses.selectedAddress.subscribe(function(add) {
        if (!add) return;
        setAddress(add);
        this.clientAddresses.selectedAddress(null);
    }.bind(this));
    this.clientAddresses.selectedAddress.subscribe(function(add) {
        if (!add) return;
        setAddress(add);
        this.serviceAddresses.selectedAddress(null);
    }.bind(this));
    this.hasServiceArea = ko.pureComputed(function() {
        return this.serviceAddresses.serviceAreas().length > 0;
    }, this);
    this.addAddress = function(serviceArea, event) {
        event.preventDefault();
        // We use directly the booking address, but reset to prevent a previous
        // address details and ID from appear
        this.booking().serviceAddress(new Address());
        // Display client service address form
        this.addressEditorOpened(true);
    }.bind(this);
    
    ///
    /// Service Professional Info
    // IMPORTANT: RESET IS FORBIDDEN, since is updated with a change at booking().serviceProfessionalUserID
    this.serviceProfessionalInfo = ko.observable(new PublicUser());
    this.isLoadingServiceProfessionalInfo = ko.observable(false);
    ko.computed(function() {
        var userID = this.booking() && this.booking().serviceProfessionalUserID();
        if (!userID) {
            this.serviceProfessionalInfo().model.reset();
            this.isLoadingServiceProfessionalInfo(false);
            return;
        }

        this.isLoadingServiceProfessionalInfo(true);

        app.model.users.getUser(userID)
        .then(function(info) {
            info.selectedJobTitleID = this.booking().jobTitleID();
            this.serviceProfessionalInfo().model.updateWith(info, true);
            this.isLoadingServiceProfessionalInfo(false);
        }.bind(this))
        .catch(function(err) {
            this.isLoadingServiceProfessionalInfo(false);
            app.modals.showError({ error: err });
        }.bind(this));
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    this.urlCp = ko.pureComputed(function() {
        var info = this.serviceProfessionalInfo();
        info = info && info.selectedJobTitle();
        var id = info && info.cancellationPolicyID() || '';
        return siteUrl + '#!cancellationPolicies/' + id + '?mustReturn=true';
    }, this);
    
    ///
    /// Date time picker(s)
    /* It returns true if user can only choose one time, that is
        on instant bookings or non-incomplete/non-request bookings
    */
    this.singleTimeOption = ko.pureComputed(function() {
        if (!this.originalBooking()) return null;
        return this.originalBooking().instantBooking() || !(this.originalBooking().isRequest() || this.originalBooking().isIncomplete());
    }, this);
    ko.computed(function triggerSelectedDatetime() {
        if (!this.booking()) return;
        var v = this.serviceStartDatePickerView(),
            dt = v && v.selectedDatetime(),
            current = this.booking().serviceDate(),
            field = this.timeFieldToBeSelected.peek();

        if (dt && field &&
            dt.toString() !== (current && current.startTime().toString())) {
            this.booking()[field](new EventDates({
                startTime: dt
            }));
            this.booking()[field]().duration({
                minutes: this.booking().pricingSummary().firstSessionDurationMinutes()
            });

            this.timeFieldToBeSelected('');
            if (this.singleTimeOption())
                this.progress.next();
        }
    }, this);
    ko.computed(function() {
        var b = this.booking();
        if (!b) return;
        var minutes = b.pricingSummary().firstSessionDurationMinutes();
        if (this.serviceStartDatePickerView() && minutes) {
            this.serviceStartDatePickerView().requiredDurationMinutes(minutes);
        }
    }, this);

    this.pickServiceDate = function() {
        this.timeFieldToBeSelected('serviceDate');
    }.bind(this);
    this.pickAlternativeDate1 = function() {
        this.timeFieldToBeSelected('alternativeDate1');
    }.bind(this);
    this.pickAlternativeDate2 = function() {
        this.timeFieldToBeSelected('alternativeDate2');
    }.bind(this);
    
    this.hasSomeDateSelected = ko.pureComputed(function() {
        var b = this.booking();
        if (!b) return false;
        return (
            b.serviceDate() && b.serviceDate().startTime() ||
            b.alternativeDate1() && b.alternativeDate1().startTime() ||
            b.alternativeDate2() && b.alternativeDate2().startTime()
        );
    }, this);
    
    this.isPhoneServiceOnly = ko.pureComputed(function() {
        if (this.isEditMode() && !this.serviceProfessionalServices.isLoading()) {
            return this.serviceProfessionalServices.selectedServices().every(function(service) {
                return service.isPhone();
            });
        }
        else {
            return !this.booking() || !this.booking().serviceAddress();
        }
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    
    ///
    /// Field Special requests (client notes to service professional)
    this.specialRequestsPlaceholder = ko.pureComputed(function() {
        var sp = this.serviceProfessionalInfo();
        sp = sp.profile() && sp.profile().firstName();

        return sp ? 'Add notes to ' + sp : 'Add notes';
    }, this);
    this.pickSpecialRequests = function() {
        app.modals.showTextEditor({
            title: this.specialRequestsPlaceholder(),
            text: this.booking().specialRequests()
        })
        .then(function(text) {
            this.booking().specialRequests(text);
        }.bind(this))
        .catch(function(err) {
            if (err) {
                app.modals.showError({ error: err });
            }
            // No error, do nothing just was dismissed
        });
    }.bind(this);
    
    ///
    /// Progress management
    this.nextStep = function() {
        this.progress.next();
    }.bind(this);
    this.getStepLabel = function(stepName) {
        return stepsLabels[stepName] || stepName;
    };
    // Reused step observers
    this.isAtSelectTimes = this.progress.observeStep('selectTimes');
    this.isAtSelectTime = this.progress.observeStep('selectTime');
    this.isAtServices = this.progress.observeStep('services');
    this.isAtLocation = this.progress.observeStep('selectLocation');
    this.isAtPayment = this.progress.observeStep('payment');
    this.isAtConfirm = this.progress.observeStep('confirm');
    // Edition links
    this.pickDateTime = function() {
        var single = this.singleTimeOption();
        this.progress.go(single ? 'selectTime' : 'selectTimes');
    }.bind(this);
    this.pickLocation = function() {
        this.progress.go('selectLocation');
    }.bind(this);
    this.pickServices = function() {
        this.progress.go('services');
    }.bind(this);
    this.pickPayment = function() {
        this.progress.go('payment');
    }.bind(this);
    
    /// Special steps preparation processes
    /// Run some logic every time an step is accessed
    ko.computed(function() {
        if (!this.booking()) return;
        switch (this.progress.currentStep()) {
            case 'selectTime':
                this.prepareDatePicker('serviceDate');
                break;
            case 'selectTimes':
                this.prepareDatePicker('');
                break;
        }
    }, this);
    
    ///
    /// Keeps the progress stepsList updated depending on the data
    ko.computed(function() {
        // Starting list, with fixed first steps:
        var list = ['services'];
        
        if (this.originalBooking() && this.booking()) {

            if (!this.isPhoneServiceOnly())
                list.push('selectLocation');

            list.push(this.singleTimeOption() ? 'selectTime' : 'selectTimes');

            if (this.booking().paymentEnabled() && this.booking().pricingSummary().totalPrice() > 0)
                list.push('payment');
        }
        // The final fixed steps
        list.push('confirm');
        // we need almost the first, for its load process to work, even if newData is not ready still

        this.progress.stepsList(list);
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

module.exports = BaseClientBookingCardVM;

BaseClientBookingCardVM.prototype.loadServices = function() {
    var b = this.booking();
    this.serviceProfessionalServices.preSelectedServices(this.booking().pricingSummary().details().map(function(s) {
        return s.model.toPlainObject();
    }));
    var spid = b.serviceProfessionalUserID();
    var jid = b.jobTitleID();
    if (this.serviceProfessionalServices.serviceProfessionalID() !== spid ||
        this.serviceProfessionalServices.jobTitleID() !== jid) {
        return this.serviceProfessionalServices.loadData(spid, jid);
    }
};

BaseClientBookingCardVM.prototype.loadServiceAddresses = function() {
    // Preselect current, if any
    var add = this.booking().serviceAddress();
    if (add && add.addressID()) {
        this.serviceAddresses.selectedAddress(add);
    }
    // Load remote addresses for provider and jobtitle, reset first
    this.serviceAddresses.sourceAddresses([]);
    this.isLoadingServiceAddresses(true);
    return this.app.model.users.getServiceAddresses(this.booking().serviceProfessionalUserID(), this.booking().jobTitleID())
    .then(function(list) {
        // Save addresses: the serviceAddresses viewmodel will create separated lists for 
        // selectable (service location) addresses and service areas
        this.serviceAddresses.sourceAddresses(this.app.model.serviceAddresses.asModel(list));
        // Load user personal addresses too if the service professional has serviceArea
        if (this.serviceAddresses.serviceAreas().length &&
            !this.isAnonymous()) {
            // jobTitleID:0 for client service addresses.
            return this.app.model.serviceAddresses.getList(0);
        }
        // No client addresses (result for the next 'then'):
        return null;
    }.bind(this))
    .then(function(clientList) {
        if (clientList) {
            this.clientAddresses.sourceAddresses(clientList.map(function(a) {
                // We wanted it to appear in the widget, must be a service location
                // (comes as 'false' from REST service since they are currently user client addresses
                // not actual 'service' addresses, even they comes from 'service' API).
                a.isServiceLocation = true;
                return this.app.model.serviceAddresses.asModel(a);
            }.bind(this)));
        }
        // All finished
        this.isLoadingServiceAddresses(false);
    }.bind(this))
    .catch(function(err) {
        this.isLoadingServiceAddresses(false);
        this.app.modals.showError({ error: err });
    }.bind(this));
};

BaseClientBookingCardVM.prototype.prepareDatePicker = function(fieldToBeSelected) {
    this.timeFieldToBeSelected(fieldToBeSelected);
    var picker = this.serviceStartDatePickerView();
    picker.selectedDatetime(null);
    picker.userID(this.booking().serviceProfessionalUserID());
    picker.selectedDate(new Date());
    picker.timeZone(this.serviceProfessionalInfo().profile().timeZone());
};
