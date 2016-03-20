'use strict';

var ko = require('knockout');
var PricingSummaryDetail = require('../models/PricingSummaryDetail');
var PricingSummaryVM = require('../viewmodels/PricingSummaryVM');
var ServiceProfessionalServiceVM = require('../viewmodels/ServiceProfessionalService');
var Booking = require('../models/Booking');
var ServiceAddresses = require('../viewmodels/ServiceAddresses');
var Address = require('../models/Address');
var EventDates = require('../models/EventDates');
var PublicUser = require('../models/PublicUser');

function BaseClientBookingCardVM(app) {
    //jshint maxstatements:100
    
    ///
    /// Data properties
    this.booking = new Booking();
    this.summary = new PricingSummaryVM();
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
        this.booking.model.reset();
        this.summary.model.reset();
        
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
    /// Computed observables and View Functions
    
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
    this.booking.jobTitleID.subscribe(this.serviceProfessionalServices.jobTitleID);
    this.booking.serviceProfessionalUserID.subscribe(this.serviceProfessionalServices.serviceProfessionalID);
    
    this.hasServicesSelected = ko.pureComputed(function() {
        var s = this.serviceProfessionalServices.selectedServices();
        return s && s.length > 0 || false;
    }, this);

    this.gratuityPercentage.subscribe(this.summary.gratuityPercentage);
    this.gratuityAmount.subscribe(this.summary.gratuityAmount);
    ko.computed(function() {
        var services = this.serviceProfessionalServices.selectedServices();
        this.summary.details(services.map(function(service) {
            return PricingSummaryDetail.fromServiceProfessionalService(service);
        }));
    }, this);
    
    // Fill booking services from the selected services view
    ko.computed(function() {
        this.booking.pricingSummary(this.summary.toPricingSummary());
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    ///
    /// Service Address
    var setAddress = function(add) {
        if (!add) return;
        this.booking.serviceAddress(add);
        if (!this.isRestoring())
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
        this.booking.serviceAddress(new Address());
        // Display client service address form
        this.addressEditorOpened(true);
    }.bind(this);
    
    ///
    /// Service Professional Info
    // IMPORTANT: RESET IS FORBIDDEN, since is updated with a change at booking.serviceProfessionalUserID
    this.serviceProfessionalInfo = ko.observable(new PublicUser());
    this.isLoadingServiceProfessionalInfo = ko.observable(false);
    this.booking.serviceProfessionalUserID.subscribe(function(userID) {
        if (!userID) {
            this.serviceProfessionalInfo().model.reset();
            this.isLoadingServiceProfessionalInfo(false);
            return;
        }

        this.isLoadingServiceProfessionalInfo(true);

        app.model.users.getUser(userID)
        .then(function(info) {
            info.selectedJobTitleID = this.booking.jobTitleID();
            this.serviceProfessionalInfo().model.updateWith(info, true);
            this.isLoadingServiceProfessionalInfo(false);
        }.bind(this))
        .catch(function(err) {
            this.isLoadingServiceProfessionalInfo(false);
            app.modals.showError({ error: err });
        }.bind(this));
    }, this);
    
    ///
    /// Date time picker(s)
    ko.computed(function triggerSelectedDatetime() {
        var v = this.serviceStartDatePickerView(),
            dt = v && v.selectedDatetime(),
            current = this.booking.serviceDate(),
            field = this.timeFieldToBeSelected.peek();

        if (dt && field &&
            dt.toString() !== (current && current.startTime().toString())) {
            this.booking[field](new EventDates({
                startTime: dt
            }));
            this.booking[field]().duration({
                minutes: this.summary.firstSessionDurationMinutes()
            });

            this.timeFieldToBeSelected('');
            // Support for progress (is optional, usually only on 'new')
            if (this.booking.instantBooking() && this.progress)
                this.progress.next();
        }
    }, this);
    this.summary.firstSessionDurationMinutes.subscribe(function(minutes) {
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
        var b = this.booking;
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
    /// States
    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingServiceProfessionalInfo() ||
            this.serviceProfessionalServices.isLoading()
        );
    }, this);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);
    
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
            text: this.booking.specialRequests()
        })
        .then(function(text) {
            this.booking.specialRequests(text);
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
