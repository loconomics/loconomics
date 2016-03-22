/**
    Booking activity
    
    It allows a client to book a serviceProfessional
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var NewClientBookingCardVM = require('../viewmodels/NewClientBookingCardVM');

var A = Activity.extend(function BookingActivity() {

    Activity.apply(this, arguments);

    // Any, we provide login and signup options integrated here
    //this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new NewClientBookingCardVM(this.app);
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
    if (!this.viewModel.isDone())
        this.viewModel.saveState();
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
    this.app.model.users.getServiceAddresses(this.viewModel.booking().serviceProfessionalUserID(), this.viewModel.booking().jobTitleID())
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
    picker.userID(this.viewModel.booking().serviceProfessionalUserID());
    picker.selectedDate(new Date());
};

A.prototype.selectTimeLoad = function() {
    this.viewModel.timeFieldToBeSelected('serviceDate');
    var picker = this.viewModel.serviceStartDatePickerView();
    picker.selectedDatetime(null);
    picker.userID(this.viewModel.booking().serviceProfessionalUserID());
    picker.selectedDate(new Date());
};

A.prototype.paymentLoad = function() {
};

A.prototype.confirmLoad = function() {
};
