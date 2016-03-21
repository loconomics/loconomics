'use strict';

var ko = require('knockout');
var BaseClientBookingCardVM = require('../viewmodels/BaseClientBookingCardVM');
var InputPaymentMethod = require('../models/InputPaymentMethod');
var BookingProgress = require('../viewmodels/BookingProgress');
var SignupVM = require('../viewmodels/Signup');
var Address = require('../models/Address');
var EventDates = require('../models/EventDates');

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

// Functions to manage the lastBooking info, for save/restore state feature
// IMPORTANT: initially used localforage, but this is cleared on a logout/login,
// being completely unuseful for the expected use of case, that is restore an imcomplete
// booking after user chooses to log-in.
//var localforage = require('localforage');
function saveLastBooking(s) {
    //return localforage.setItem('lastBooking', s);
    return new Promise(function(resolve) {
        var d = JSON.stringify(s);
        sessionStorage.setItem('lastBooking', d);
        resolve(d);
    });
}
function loadLastBooking() {
    //return localforage.getItem('lastBooking');
    return new Promise(function(resolve) {
        var d = sessionStorage.getItem('lastBooking');
        resolve(JSON.parse(d));
    });
}
function clearLastBooking() {
    //return localforage.removeItem('lastBooking');
    return new Promise(function(resolve) {
        sessionStorage.removeItem('lastBooking');
        resolve();
    });
}

function NewClientBookingCardVM(app) {
    //jshint maxstatements:40
    // Base Class:
    BaseClientBookingCardVM.call(this, app);
    
    ///
    /// Data properties
    this.newDataReady = ko.observable(false);
    this.bookCode = ko.observable(null);
    this.makeRepeatBooking = ko.observable(false);
    this.promotionalCode = ko.observable('');
    this.paymentMethod = ko.observable(null); // InputPaymentMethod
    /// Progress management
    // Se inicializa con un estado previo al primer paso
    // (necesario para el manejo de reset y preparación del activity)
    this.progress = new BookingProgress({ step: -1 });
    /// Signup
    this.signupVM = new SignupVM(app);
    // States
    this.isLoadingNewBooking = ko.observable(false);
    this.isRestoring = ko.observable(false);
    this.isDone = ko.observable(false);
    
    ///
    /// States
    var baseIsLoading = this.isLoading;
    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingNewBooking() ||
            baseIsLoading()
        );
    }, this);
    
    ///
    /// Reset
    var baseReset = this.reset;
    this.reset = function reset() {
        baseReset();

        this.newDataReady(false);
        this.bookCode(null);
        
        this.promotionalCode('');
        this.paymentMethod(null);
        this.makeRepeatBooking(false);
        
        this.signupVM.reset();
        
        this.progress.step(-1);
        this.isSaving(false);
        this.isDone(false);
    }.bind(this);
    
    ///
    /// Save and Restore State
    this.saveState = function saveState() {
        // IMPORTANT: Not all booking and view observables data is saved, since
        // lot of that are managed by the initial booking setup, state
        // info, and other data needs a verification, like the list of selected
        // services, cannot be copied into the booking 'as is' since needs to
        // be checked against the list of available services (could have changed,
        // most times because of first-time only services).
        
        // Base and identification data:
        var s = {
            serviceProfessionalUserID: this.booking.serviceProfessionalUserID(),
            jobTitleID: this.booking.jobTitleID(),
            bookCode: this.bookCode()
        };
        
        var services = this.serviceProfessionalServices.selectedServices();
        s.services = services.map(function(serv) {
            return serv.serviceProfessionalServiceID();
        });
        
        s.presetGratuity = this.presetGratuity();
        s.gratuityAmount = this.gratuityAmount();
        s.promotionalCode = this.promotionalCode();
        
        var add = this.booking.serviceAddress();
        s.serviceAddress = add && add.model.toPlainObject(true) || null;
        
        s.serviceDate = this.booking.serviceDate();
        s.serviceDate = s.serviceDate ? s.serviceDate.model.toPlainObject() : null;
        s.alternativeDate1 = this.booking.alternativeDate1();
        s.alternativeDate1 = s.alternativeDate1 ? s.alternativeDate1.model.toPlainObject() : null;
        s.alternativeDate2 = this.booking.alternativeDate2();
        s.alternativeDate2 = s.alternativeDate2 ? s.alternativeDate2.model.toPlainObject() : null;
        
        s.specialRequests = this.booking.specialRequests();
        
        var pm = this.paymentMethod();
        s.paymentMethod = pm ? pm.model.toPlainObject(true) : null;

        return saveLastBooking(s);

    }.bind(this);
    
    /**
        Restore the last booking state from local storage,
        but only if it matches the identification data for the
        booking being loaded (booking already initialized).
    **/
    this.restoreState = function restoreState() {
        this.isRestoring(true);
        return loadLastBooking().then(function(s) {
            //jshint maxdepth:6, maxcomplexity:11
            if (!s) {
                this.isRestoring(false);
                return;
            }
            
            // Once is used, delete (is not last anymore)
            clearLastBooking();
                
            var spuid = this.booking.serviceProfessionalUserID();
            var jid = this.booking.jobTitleID();
            if (s.serviceProfessionalUserID === spuid &&
                s.jobTitleID === jid) {
                this.bookCode(s.bookCode);

                this.serviceProfessionalServices.once('loaded', function() {
                    this.isRestoring(true);
                    // List of selected services is expected to be empty/reseted at this time
                    // and source list loaded
                    this.serviceProfessionalServices.list().forEach(function(serv) {
                        if (s.services.indexOf(serv.serviceProfessionalServiceID()) > -1) {
                            serv.isSelected(true);
                            this.serviceProfessionalServices.selectedServices.push(serv);
                        }
                    }.bind(this));
                    this.isRestoring(false);
                }.bind(this));

                this.presetGratuity(s.presetGratuity);
                this.gratuityAmount(s.gratuityAmount);
                this.promotionalCode(s.promotionalCode);

                if (s.serviceAddress) {
                    // Attach a callback to run the 'restore selected address' once
                    // the data has being loaded.
                    // We want that Only ONCE, for that we get subscription and we remove it
                    // at fist callback run
                    var addressSubscription = this.isLoadingServiceAddresses.subscribe(function(isIn) {
                        if (isIn) return;
                        // No more than once:
                        addressSubscription.dispose();
                        
                        this.isRestoring(true);
                        
                        if (s.serviceAddress.addressID) {
                            // Search in lists
                            var foundAddress;
                            var searchAddress = function(add) {
                                if (add.addressID() === s.serviceAddress.addressID) {
                                    foundAddress = add;
                                    return true;
                                }
                            };
                            this.serviceAddresses.addresses().some(searchAddress);
                            if (foundAddress) {
                                this.serviceAddresses.selectedAddress(foundAddress);
                            }
                            else {
                                this.clientAddresses.addresses().some(searchAddress);
                                if (foundAddress) {
                                    this.clientAddresses.selectedAddress(foundAddress);
                                }
                            }
                        } else {
                            // It's a client new address
                            this.booking.serviceAddress(new Address(s.serviceAddress));
                            this.addressEditorOpened(true);
                        }
                        
                        this.isRestoring(false);
                    }.bind(this));
                }
                
                this.booking.serviceDate(s.serviceDate ? new EventDates(s.serviceDate) : null);
                this.booking.alternativeDate1(s.alternativeDate1 ? new EventDates(s.alternativeDate1) : null);
                this.booking.alternativeDate2(s.alternativeDate2 ? new EventDates(s.alternativeDate2) : null);
                
                this.booking.specialRequests(s.specialRequests);
                
                var pm = s.paymentMethod;
                if (pm && this.paymentMethod()) {
                    this.paymentMethod().model.updateWith(pm, true);
                }
            }
            this.isRestoring(false);
        }.bind(this))
        .catch(function(err) {
            console.error('Last Booking state could not being restored', err);
            this.isRestoring(false);
        }.bind(this));
    }.bind(this);
    

    this.isAnonymous = ko.pureComputed(function() {
        var u = app.model.user();
        return u && u.isAnonymous();
    });
    
    this.confirmBtnText = ko.pureComputed(function() {
        return this.isAnonymous() ? 'Sign up and confirm' : 'Confirm';
    }, this);
    
    // Displayed text when there is a payment card
    this.paymentMethodDisplay = ko.pureComputed(function() {
        var n = this.booking.paymentLastFourCardNumberDigits();
        return n ? 'Card ending in ' + n : '';
    }, this);
    ko.computed(function() {
        var pm = this.paymentMethod(),
            number = pm && pm.cardNumber();
        if (number) {
            var last = number.slice(-4);
            this.booking.paymentLastFourCardNumberDigits(last);
        }
    }, this);
    
    ///
    /// Progress management
    this.nextStep = function() {
        this.progress.next();
    }.bind(this);
    this.goStep = function(stepName) {
        var i = this.progress.stepsList().indexOf(stepName);
        this.progress.step(i > -1 ? i : 0);
    };
    this.getStepLabel = function(stepName) {
        return stepsLabels[stepName] || stepName;
    };
    // Reused step observers
    this.isAtSelectTimes = this.progress.observeStep('selectTimes');
    this.isAtSelectTime = this.progress.observeStep('selectTime');
    
    ///
    /// Keeps the progress stepsList updated depending on the data
    ko.computed(function() {
        // Starting list, with fixed first steps:
        var list = ['services'];
        
        if (this.newDataReady()) {

            if (!this.isPhoneServiceOnly())
                list.push('selectLocation');

            list.push(this.booking.instantBooking() ? 'selectTime' : 'selectTimes');

            if (this.booking.paymentEnabled())
                list.push('payment');

            // The final fixed steps
            list.push('confirm');
        }
        // we need almost the first, for its load process to work, even if newData is not ready still

        this.progress.stepsList(list);
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
    ///
    /// New Booking data
    this.initBooking = function(serviceProfessionalID, jobTitleID, bookCode) {
        this.reset();
        this.bookCode(bookCode);
        
        this.isLoadingNewBooking(true);
        
        app.model.bookings.getNewClientBooking({
            serviceProfessionalUserID: serviceProfessionalID,
            jobTitleID: jobTitleID,
            bookCode: bookCode
        }).then(function(bookingData) {
            this.booking.model.updateWith(bookingData, true);
            if (this.booking.paymentEnabled()) {
                var ipm = new InputPaymentMethod();
                ipm.billingAddress(new Address());
                this.paymentMethod(ipm);
            }
            this.summary.firstTimeServiceFeeFixed(bookingData.pricingSummary.firstTimeServiceFeeFixed);
            this.summary.firstTimeServiceFeePercentage(bookingData.pricingSummary.firstTimeServiceFeePercentage);
            this.summary.firstTimeServiceFeeMaximum(bookingData.pricingSummary.firstTimeServiceFeeMaximum);
            this.summary.firstTimeServiceFeeMinimum(bookingData.pricingSummary.firstTimeServiceFeeMinimum);
            
            return this.restoreState();
        }.bind(this)).then(function() {
            this.isLoadingNewBooking(false);
            this.newDataReady(true);
            
            // Reset progress to none and trigger next so Load logic gets executed
            this.progress.step(-1);
            this.nextStep();
        }.bind(this))
        .catch(function(err) {
            this.isLoadingNewBooking(false);
            app.modals.showError({ error: err });
        }.bind(this));
    }.bind(this);
    
    ///
    /// UI
    this.bookingHeader = ko.pureComputed(function() {
        var v = this.booking.instantBooking();
        return v === true ? 'Your instant booking' : v === false ? 'Your booking request' : '';
    }, this);
    
    ///
    /// Save
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
            this.booking.model.updateWith(serverBooking, true);
            
            // Forget availability cache for this professional, since is not needed
            // and any new booking with it needs a refresh to avoid problems. See #905
            app.model.availability.clearUserCache(this.booking.serviceProfessionalUserID());
            this.isDone(true);
            
            app.modals.showNotification({
                title: 'Done!',
                message: 'Your booking was created!'
            })
            .then(function() {
                app.shell.go('/');
            });
        }.bind(this);
        // error handling
        var onerror = function(err) {
            this.isSaving(false);
            app.modals.showError({ error: err });
        }.bind(this);

        // If anonymous, must pass the signup, and only after save booking
        if (this.isAnonymous()) {
            this.signupVM.performSignup()
            .then(saveIt)
            .then(success)
            .catch(onerror);
        }
        else {
            saveIt()
            .then(success)
            .catch(onerror);
        }
    }.bind(this);
    
    this.goLogin = function(d, e) {
        app.shell.go('/login', { redirectUrl: app.shell.currentRoute.url });
        if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }.bind(this);
}
NewClientBookingCardVM._inherits(BaseClientBookingCardVM);

module.exports = NewClientBookingCardVM;
