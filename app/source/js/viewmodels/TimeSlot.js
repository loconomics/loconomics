/**
    TimeSlot view model (aka: CalendarSlot) for use
    as part of the template/component time-slot-tile or activities
    providing data for the template.
**/
'use strict';

var getObservable = require('../utils/getObservable');
var numeral = require('numeral');
var Appointment = require('../models/Appointment');
var ko = require('knockout');
var moment = require('moment');
var user = require('../data/userProfile').data;

function TimeSlotViewModel(params) {
    /*jshint maxcomplexity:9*/

    this.startTime = getObservable(params.startTime || null);
    this.endTime = getObservable(params.endTime || null);
    this.summary = getObservable(params.summary || null);
    this.link = getObservable(params.link || null);
    this.price = getObservable(params.price || null);
    this.classNames = getObservable(params.classNames || null);
    this.apt = getObservable(params.apt || null);

    this.ariaLabel = ko.pureComputed(function(){
        var apt = this.apt();
        if (!apt) return '';
        var start = moment(this.startTime()).format('h:mma');
        var end = moment(this.endTime()).format('h:mma');
        var labelSummary = '';
        var clickAction = '';
        if (Appointment.specialIds.free === apt.id()) {
            clickAction = '. Click to add a new booking or calendar block.';
            labelSummary = this.summary();
        }
        else if (apt.id() > 0 && apt.sourceBooking().isRequest()) {
            clickAction = '. Click to respond to request.';
            labelSummary = this.summary() + ', with total price of ' + this.price();
        }
        else if (apt.id() > 0 && apt.sourceBooking().isConfirmed()) {
            clickAction = '. Click to view booking details.';
            labelSummary = this.summary() + ', with total price of ' + this.price();
        }
        else {
            clickAction = '. Click to view details and make changes.';
        }
        return labelSummary + ', from ' + start + ' until ' + end + clickAction;
    }, this);
}

module.exports = TimeSlotViewModel;

/**
    Static constructor to convert an Appointment model into 
    a TimeSlot instance following UI criteria for preset values/setup.
**/
TimeSlotViewModel.fromAppointment = function fromAppointment(apt) {
    /*jshint maxcomplexity:12 */
    
    // Commented the option to detect and not link unavail slots:
    //var unavail = Appointment.specialIds.unavailable === apt.id();
    //var link = null;
    //if (!unavail)
    var link = '#!appointment/' + apt.startTime().toISOString() + '/' + apt.id();
    
    if (apt.id() === Appointment.specialIds.preparationTime) {
        // Special link case: it goes to scheduling preferences to allow quick edit
        // the preparation time slots
        link = '#!schedulingPreferences?mustReturn=1';
    }

    var classNames = '';
    var timeSlotSummary = '';
    if (Appointment.specialIds.free === apt.id()) {
        classNames = 'Item--tag-gray-lighter ';
        timeSlotSummary = apt.summary();
    }
    else if (apt.id() > 0 && apt.sourceBooking()) {
        var clientID = apt.sourceBooking().clientUserID();
        if (apt.sourceBooking().isRequest()) {
            classNames = 'Item--tag-warning ';
            if (clientID == user.userID()) {
                timeSlotSummary = 'Request for ' + apt.summary() + ' by ' + ' professional';
            }
            else {
                timeSlotSummary = 'Request for ' + apt.summary() + ' for ' + ' client';
            }
        }
        else {
            classNames = 'Item--tag-primary ';
            if (clientID == user.userID()) {
                timeSlotSummary = apt.summary() + ' by ' + ' professional';
            }
            else {
                timeSlotSummary = apt.summary() + ' for ' + ' client';
            }
        }
    }
    else {
        // any block event, preparation time slots
        classNames = 'Item--tag-danger ';
        timeSlotSummary = apt.summary();
    }
    return new TimeSlotViewModel({
        startTime: apt.startTime,
        endTime: apt.endTime,
        summary: timeSlotSummary,
        link: link,
        apt: apt,
        price: (
            apt.sourceBooking() && 
            apt.sourceBooking().pricingSummary() ? 
            numeral(apt.sourceBooking().pricingSummary().totalPrice() || 0).format('$0.00') :
            null
        ),
        classNames: classNames
    });
};
