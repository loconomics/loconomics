'use strict';

var ko = require('knockout');
var Booking = require('../models/Booking.editable');
var ServiceProfessionalServiceVM = require('../viewmodels/ServiceProfessionalService');
var ServiceAddresses = require('../viewmodels/ServiceAddresses');
var Address = require('../models/Address');
var EventDates = require('../models/EventDates');
var PublicUser = require('../models/PublicUser');
var ModelVersion = require('../utils/ModelVersion');

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

    /// States (other states are computed)
    this.isSaving = ko.observable(false);

    ///
    /// URLs (constants, don't need reset)
    this.urlTos = ko.observable('https://loconomics.com/en-US/About/TermsOfUse/');
    this.urlPp = ko.observable('https://loconomics.com/en-US/About/PrivacyPolicy/');
    this.urlBcp = ko.observable('https://loconomics.com/en-US/About/BackgroundCheckPolicy/');
    this.urlCp = ko.observable('https://loconomics.com/en-US/About/CancellationPolicy/');    
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
            // TODO PRESET ADDRESS AS SELECTED IF BELONGS TO PROFESSIONAL OR SET IT WHEN LOADED??
            this.loadServiceAddresses();
        }

    }.bind(this);
    
    this.cancel = function cancel() {
        if (this.isLocked()) return;

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editedVersion(null);
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
        if (this.nextStep && !this.isRestoring())
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
    
    ///
    /// Date time picker(s)
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
            // Support for progress (is optional, usually only on 'new')
            if (this.booking().instantBooking() && this.progress)
                this.progress.next();
        }
    }, this);
    ko.computed(function() {
        var b = this.booking();
        if (!b) return;
        var minutes = b.pricingSummary().firstSessionDurationMinutes();
        if (this.serviceStartDatePickerView()) {
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
        return this.serviceProfessionalServices.selectedServices().every(function(service) {
            return service.isPhone();
        });
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
};
