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
        helpLink: '/help'
    });
    this.navBar.title('Booking');
  
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
    this.viewModel.loadServices();
};

A.prototype.selectLocationLoad = function() {
    this.viewModel.loadServiceAddresses();
};

A.prototype.selectTimesLoad = function() {
};

A.prototype.selectTimeLoad = function() {
};

A.prototype.paymentLoad = function() {
};

A.prototype.confirmLoad = function() {
};
