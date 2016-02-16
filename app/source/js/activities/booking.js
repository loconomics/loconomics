/**
    Booking activity
    
    It allows a client to book a serviceProfessional
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout'),
    SignupVM = require('../viewmodels/Signup');

var A = Activity.extend(function BookingActivity() {

    Activity.apply(this, arguments);

    // Any, we provide login and signup options integrated here
    //this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Booking', {
        helpLink: '/faqs/booking'
    });
    this.navBar.title('Booking');
    
    // Only on change (not first time), when choosed the option 'custom'
    // from gratuity, focus the textbox to input the custom value
    this.viewModel.presetGratuity.subscribe(function(preset) {
        if (preset === 'custom') {
            // Small delay to allow the binding to display the custom field,
            // the UI to update, and then focus it; trying to do it without
            // timeout will do nothing.
            setTimeout(function() {
                this.$activity.find('[name=custom-gratuity]').focus();
            }.bind(this), 50);
        }
    }.bind(this));
    
    this.registerHandler({
        target: this.viewModel.progress.step,
        handler: function() {
            // Trigger load of the specific step
            var load = this[this.viewModel.progress.currentStep() + 'Load'];
            if (load)
                load.call(this);
        }.bind(this)
    });

    var labelTpl = '__step__ of __total__';
    var nav = this.navBar;
    ko.computed(function() {
        var step = this.step() + 1;
        var total = this.totalSteps();
        var label = 'Booking';
        if (step > 0 && total > 1) {
            label = labelTpl
            .replace('__step__', step)
            .replace('__total__', total);
        }
        nav.title(label);
    }, this.viewModel.progress);
    
    // Remote postal code look-up
    // NOTE: copied the code from addressEditor.js with slight changes
    var app = this.app,
        viewModel = this.viewModel;
    this.registerHandler({
        target: this.viewModel.booking.serviceAddress,
        handler: function(address) {
            if (address &&
               !address.postalCode._hasLookup) {
                address.postalCode._hasLookup = true;
                
                // On change to a valid code, do remote look-up
                ko.computed(function() {
                    // Only on addresses being edited by the user, with the editor opened
                    if (!viewModel.addressEditorOpened()) return;
                    
                    var postalCode = this.postalCode();
                    
                    if (postalCode && !/^\s*$/.test(postalCode)) {
                        app.model.postalCodes.getItem(postalCode)
                        .then(function(info) {
                            if (info) {
                                address.city(info.city);
                                address.stateProvinceCode(info.stateProvinceCode);
                                address.stateProvinceName(info.stateProvinceName);
                                viewModel.errorMessages.postalCode('');
                            }
                        })
                        .catch(function(err) {
                            address.city('');
                            address.stateProvinceCode('');
                            address.stateProvinceName('');
                            // Expected errors, a single message, set
                            // on the observable
                            var msg = typeof(err) === 'string' ? err : null;
                            if (msg || err && err.responseJSON && err.responseJSON.errorMessage) {
                                viewModel.errorMessages.postalCode(msg || err.responseJSON.errorMessage);
                            }
                            else {
                                // Log to console for debugging purposes, on regular use an error on the
                                // postal code is not critical and can be transparent; if there are 
                                // connectivity or authentification errors will throw on saving the address
                                console.error('Server error validating Zip Code', err);
                            }
                        });
                    }
                }, address)
                // Avoid excessive requests by setting a timeout since the latest change
                .extend({ rateLimit: { timeout: 60, method: 'notifyWhenChangesStop' } });
            }
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var referrer = this.app.shell.referrerRoute;
    referrer = referrer && referrer.url;
    // Avoid links to this same page
    var reg = /\/?booking/i;
    if (!referrer || reg.test(referrer)) {
        referrer = '/';
    }
    this.convertToCancelAction(this.navBar.leftAction(), referrer);

    var params = state && state.route && state.route.segments;
    var bookCode = state && state.route && state.route.query.bookCode;

    this.viewModel.initBooking(params[0] |0, params[1] |0, bookCode);
};

A.prototype.hide = function hide() {
    Activity.prototype.hide.call(this);
    this.viewModel.saveState();
};

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

///
/// Methods that initialize/load each step, given the name of registered steps
/// and sufix 'Load'

A.prototype.servicesLoad = function() {
    // TODO Depends on jobTitle:
    this.viewModel.supportsGratuity(false);    
};

A.prototype.selectLocationLoad = function() {
    // Load remote addresses for provider and jobtitle, reset first
    this.viewModel.serviceAddresses.sourceAddresses([]);
    this.viewModel.isLoadingServiceAddresses(true);
    this.app.model.users.getServiceAddresses(this.viewModel.booking.serviceProfessionalUserID(), this.viewModel.booking.jobTitleID())
    .then(function(list) {
        // Save addresses: the serviceAddresses viewmodel will create separated lists for 
        // selectable (service location) addresses and service areas
        this.viewModel.serviceAddresses.sourceAddresses(this.app.model.serviceAddresses.asModel(list));
        // Load user personal addresses too if the service professional has serviceArea
        if (this.viewModel.serviceAddresses.serviceAreas().length &&
            !this.viewModel.isAnonymous()) {
            // jobTitleID:0 for client service addresses.
            return this.app.model.serviceAddresses.getList(0);
        }
        // No client addresses (result for the next 'then'):
        return null;
    }.bind(this))
    .then(function(clientList) {
        if (clientList) {
            this.viewModel.clientAddresses.sourceAddresses(clientList.map(function(a) {
                // We wanted it to appear in the widget, must be a service location
                // (comes as 'false' from REST service since they are currently user client addresses
                // not actual 'service' addresses, even they comes from 'service' API).
                a.isServiceLocation = true;
                return this.app.model.serviceAddresses.asModel(a);
            }.bind(this)));
        }
        // All finished
        this.viewModel.isLoadingServiceAddresses(false);
    }.bind(this))
    .catch(function(err) {
        this.viewModel.isLoadingServiceAddresses(false);
        this.app.modals.showError({ error: err });
    }.bind(this));
};

A.prototype.selectTimesLoad = function() {
    var picker = this.viewModel.serviceStartDatePickerView();
    this.viewModel.timeFieldToBeSelected('');
    picker.selectedDatetime(null);
    picker.userID(this.viewModel.booking.serviceProfessionalUserID());
    picker.selectedDate(new Date());
};

A.prototype.selectTimeLoad = function() {
    this.viewModel.timeFieldToBeSelected('serviceDate');
    var picker = this.viewModel.serviceStartDatePickerView();
    picker.selectedDatetime(null);
    picker.userID(this.viewModel.booking.serviceProfessionalUserID());
    picker.selectedDate(new Date());
};

A.prototype.paymentLoad = function() {
};

A.prototype.confirmLoad = function() {
};


var Model = require('../models/Model');
var numeral = require('numeral');

var PricingSummaryDetail = require('../models/PricingSummaryDetail'),
    PricingSummary = require('../models/PricingSummary');

var ServiceProfessionalServiceVM = require('../viewmodels/ServiceProfessionalService'),
    BookingProgress = require('../viewmodels/BookingProgress'),
    Booking = require('../models/Booking'),
    ServiceAddresses = require('../viewmodels/ServiceAddresses'),
    InputPaymentMethod = require('../models/InputPaymentMethod'),
    Address = require('../models/Address'),
    EventDates = require('../models/EventDates'),
    PublicUser = require('../models/PublicUser');

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

function ViewModel(app) {
    //jshint maxstatements:100
    
    ///
    /// Data properties
    this.booking = new Booking();
    this.newDataReady = ko.observable(false);
    this.summary = new PricingSummaryVM();
    this.bookCode = ko.observable(null);
    this.serviceProfessionalServices = new ServiceProfessionalServiceVM(app);
    this.serviceProfessionalServices.isSelectionMode(true);
    this.serviceProfessionalServices.preSelectedServices([]);
    this.makeRepeatBooking = ko.observable(false);
    this.promotionalCode = ko.observable('');
    this.paymentMethod = ko.observable(null); // InputPaymentMethod
    /// Signup
    this.signupVM = new SignupVM(app);
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
    this.isLoadingNewBooking = ko.observable(false);
    this.isRestoring = ko.observable(false);
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
        this.newDataReady(false);
        this.summary.model.reset();
        this.bookCode(null);
        
        this.serviceProfessionalServices.reset();
        this.serviceProfessionalServices.isSelectionMode(true);
        this.serviceProfessionalServices.preSelectedServices([]);

        this.promotionalCode('');
        this.paymentMethod(null);
        this.makeRepeatBooking(false);
        
        this.signupVM.reset();
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
        this.progress.step(-1);
        this.isSaving(false);
        this.isLoadingNewBooking(false);
        this.isRestoring(false);
        
        this.errorMessages.postalCode('');
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
    
    // Sync: Automatic updates between dependent models:
    this.booking.jobTitleID.subscribe(this.serviceProfessionalServices.jobTitleID);
    this.booking.serviceProfessionalUserID.subscribe(this.serviceProfessionalServices.serviceProfessionalID);

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

            if (this.booking.instantBooking())
                this.progress.next();
            else
                this.timeFieldToBeSelected('');
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

    
    this.isPhoneServiceOnly = ko.pureComputed(function() {
        return this.serviceProfessionalServices.selectedServices().every(function(service) {
            return service.isPhone();
        });
    }, this).extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
    
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
            this.booking.model.updateWith(bookingData);
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
    /// States
    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingNewBooking() ||
            this.isLoadingServiceProfessionalInfo() ||
            this.serviceProfessionalServices.isLoading()
        );
    }, this);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
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
            this.booking.model.updateWith(serverBooking);
            
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
    
    this.goLogin = function(d, e) {
        app.shell.go('/login', { redirectUrl: app.shell.currentRoute.url });
        if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }.bind(this);
}

function PricingSummaryVM(values) {

    Model(this);

    this.model.defProperties({
        details: {
            isArray: true,
            Model: PricingSummaryDetail
        },
        gratuityPercentage: 0,
        gratuityAmount: 0,
        firstTimeServiceFeeFixed: 0,
        firstTimeServiceFeePercentage: 0,
        firstTimeServiceFeeMaximum: 0,
        firstTimeServiceFeeMinimum: 0
    }, values);

    this.subtotalPrice = ko.pureComputed(function() {
        return this.details().reduce(function(total, item) {
            total += item.price();
            return total;
        }, 0);
    }, this);
    
    this.fees = ko.pureComputed(function() {
        var t = +this.subtotalPrice(),
            f = +this.firstTimeServiceFeeFixed(),
            p = +this.firstTimeServiceFeePercentage(),
            min = +this.firstTimeServiceFeeMinimum(),
            max = +this.firstTimeServiceFeeMaximum();
        var a = Math.round((f + ((p / 100) * t)) * 100) / 100;
        return Math.min(Math.max(a, min), max);
    }, this);
    
    this.gratuity = ko.pureComputed(function() {
        var percentage = this.gratuityPercentage() |0,
            amount = this.gratuityAmount() |0;
        return (
            percentage > 0 ?
                (this.subtotalPrice() * (percentage / 100)) :
                amount < 0 ? 0 : amount
        );
    }, this);

    this.totalPrice = ko.pureComputed(function() {
        return this.subtotalPrice() + this.fees() + this.gratuity();
    }, this);
    
    this.feesMessage = ko.pureComputed(function() {
        var f = numeral(this.fees()).format('$#,##0.00');
        return '*The first-time __fees__ booking fee applies only to the very first time you connect with a professional and helps cover costs of running the marketplace. There are no fees for subsequent bookings with this professional.'.replace(/__fees__/g, f);
    }, this);

    this.items = ko.pureComputed(function() {

        var items = this.details().slice();
        var gratuity = this.gratuity();

        if (gratuity > 0) {
            var gratuityLabel = this.gratuityPercentage() ?
                'Gratuity (__gratuity__%)'.replace(/__gratuity__/g, (this.gratuityPercentage() |0)) :
                'Gratuity';

            items.push(new PricingSummaryDetail({
                serviceName: gratuityLabel,
                price: gratuity
            }));
        }
        
        var fees = this.fees();
        if (fees > 0) {
            var feesLabel = 'First-time booking fee*';
            items.push(new PricingSummaryDetail({
                serviceName: feesLabel,
                price: fees
            }));
        }

        return items;
    }, this);
    
    this.serviceDurationMinutes = ko.pureComputed(function() {
        return this.details().reduce(function(total, item) {
            total += item.serviceDurationMinutes();
            return total;
        }, 0);
    }, this);
    
    this.firstSessionDurationMinutes = ko.pureComputed(function() {
        return this.details().reduce(function(total, item) {
            total += item.firstSessionDurationMinutes();
            return total;
        }, 0);
    }, this);
    
    var duration2Language = require('../utils/duration2Language');
    
    this.serviceDurationDisplay = ko.pureComputed(function() {
        return duration2Language({ minutes: this.serviceDurationMinutes() });
    }, this);
    
    this.firstSessionDurationDisplay = ko.pureComputed(function() {
        return duration2Language({ minutes: this.firstSessionDurationMinutes() });
    }, this);
    
    this.toPricingSummary = function() {
        var plain = this.model.toPlainObject(true);
        plain.subtotalPrice = this.subtotalPrice();
        plain.clientServiceFeePrice = this.fees();
        plain.totalPrice = this.totalPrice();
        plain.serviceDurationMinutes = this.serviceDurationMinutes();
        plain.firstSessionDurationMinutes = this.firstSessionDurationMinutes();
        return new PricingSummary(plain);
    };
}
