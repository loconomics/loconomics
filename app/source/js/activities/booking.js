/**
    Booking activity
    
    It allows a client to book a serviceProfessional
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function BookingActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Booking');
    
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

});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    var bookCode = state && state.route && state.route.query.bookCode;

    this.viewModel.initBooking(params[0] |0, params[1] |0, bookCode);
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
    this.viewModel.supportsGratuity(true);    
};

A.prototype.selectLocationLoad = function() {
    // Load remote addresses for provider and jobtitle, reset first
    this.viewModel.serviceAddresses.sourceAddresses([]);
    this.viewModel.isLoadingServiceAddresses(true);
    this.app.model.users.getServiceAddresses(this.viewModel.booking.serviceProfessionalUserID(), this.viewModel.booking.jobTitleID())
    .then(function(list) {
        list = this.app.model.serviceAddresses.asModel(list);
        this.viewModel.serviceAddresses.sourceAddresses(list);
        this.viewModel.isLoadingServiceAddresses(false);
        // TODO: Load user personal addresses too if the service professional has serviceRadius
    }.bind(this))
    .catch(function(err) {
        this.viewModel.isLoadingServiceAddresses(false);
        this.app.modals.showError({ error: err });
    });
};

A.prototype.selectTimesLoad = function() {
    this.viewModel.serviceStartDatePickerView().selectedDatetime(null);
    this.viewModel.timeFieldToBeSelected('');
};

A.prototype.selectTimeLoad = function() {
    this.viewModel.serviceStartDatePickerView().selectedDatetime(null);
    this.viewModel.timeFieldToBeSelected('serviceDate');
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

function ViewModel(app) {
    //jshint maxstatements:100
    
    ///
    /// Booking Data, request options and related entities
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
    /// Address
    this.serviceAddresses = new ServiceAddresses();
    this.isLoadingServiceAddresses = ko.observable(false);
    this.serviceAddresses.selectedAddress.subscribe(this.booking.serviceAddress, this);

    ///
    /// Gratuity
    // TODO Complete support for gratuity, server-side
    this.supportsGratuity = ko.observable(false);
    this.customGratuity = ko.observable(0);
    this.presetGratuity = ko.observable(0);
    this.gratuityAmount = ko.observable(0);
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
    /// Service Professional Info
    this.serviceProfessionalInfo = ko.observable(new PublicUser());
    this.isLoadingServiceProfessionalInfo = ko.observable(false);
    this.booking.serviceProfessionalUserID.subscribe(function(userID) {
        if (!userID) this.serviceProfessionalInfo(null);

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
    this.serviceStartDatePickerView = ko.observable(null);
    this.timeFieldToBeSelected = ko.observable('');
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
    
    ///
    /// Progress management
    // Se inicializa con un estado previo al primer paso
    // (necesario para el manejo de reset y preparación del activity)
    this.progress = new BookingProgress({ step: -1 });
    
    this.nextStep = function() {
        this.progress.next();
    };
    
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
    /// Reset
    this.reset = function reset() {
        this.newDataReady(false);
        this.booking.model.reset();
        this.serviceProfessionalServices.preSelectedServices([]);
        this.customGratuity(0);
        this.presetGratuity(0);
        this.gratuityAmount(0);
        this.promotionalCode('');
        this.makeRepeatBooking(false);
        this.paymentMethod(null);
    }.bind(this);
    
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
    this.isLoadingNewBooking = ko.observable(false);
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
    this.isSaving = ko.observable();
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);

    ///
    /// Save
    this.save = function() {
        // Final step, confirm and save booking
        this.isSaving(true);
        
        var requestOptions = {
            promotionalCode: this.promotionalCode(),
            bookCode: this.bookCode()
        };
        
        app.model.bookings.requestClientBooking(this.booking, requestOptions, this.paymentMethod())
        .then(function(serverBooking) {
            this.isSaving(false);
            this.booking.model.updateWith(serverBooking);
        }.bind(this))
        .catch(function(err) {
            this.isSaving(false);
            app.modals.showError({ error: err });
        }.bind(this));
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
        feesPercentage: 10
    }, values);

    this.subtotalPrice = ko.pureComputed(function() {
        return this.details().reduce(function(total, item) {
            total += item.price();
            return total;
        }, 0);
    }, this);
    
    this.fees = ko.pureComputed(function() {
        var t = this.subtotalPrice(),
            f = this.feesPercentage();
        return t * (f / 100);
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
        return '*includes a __fees__ first-time booking fee'.replace(/__fees__/g, f);
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
                price: this.gratuity()
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
        plain.feePrice = this.fees();
        plain.totalPrice = this.totalPrice();
        plain.serviceDurationMinutes = this.serviceDurationMinutes();
        plain.firstSessionDurationMinutes = this.firstSessionDurationMinutes();
        return new PricingSummary(plain);
    };
}
