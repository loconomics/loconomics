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
        var clickAction = '';
        if (Appointment.specialIds.free === apt.id()) {
            clickAction = '. Click to add a new booking or calendar block.';
        }
        else if (apt.id() > 0 && apt.sourceBooking().isRequest()) {
            clickAction = '. Click to respond to request.';
        }
        else {
            clickAction = '. Click to view details and make changes.';
        }
        return this.summary() + ' from ' + start + ' until ' + end + clickAction;
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

    var classNames = null;
    if (Appointment.specialIds.free === apt.id()) {
        classNames = 'Item--tag-gray-lighter ';
    }
    else if (apt.id() > 0 && apt.sourceBooking()) {
        if (apt.sourceBooking().isRequest())
            classNames = 'Item--tag-warning ';
        else
            classNames = 'Item--tag-primary ';
    }
    else {
        // any block event, preparation time slots
        classNames = 'Item--tag-danger ';
    }

    var timeSlotSummary = '';
    if (Appointment.specialIds.free === apt.id()) {
        timeSlotSummary = apt.summary();
    }
    else if (apt.id() > 0 && apt.sourceBooking()) {
        var clientID = apt.sourceBooking().clientUserID();
        if (clientID == user.userID()) {
            if (apt.sourceBooking().isRequest())
                timeSlotSummary = 'Request for ' + apt.summary() + ' by ' + ' professional';
            else
                timeSlotSummary = apt.summary() + ' by ' + ' professional';
        }
        else {
            if (apt.sourceBooking().isRequest())
                timeSlotSummary = 'Request for ' + apt.summary() + ' by ' + ' client';
            else
                timeSlotSummary = apt.summary() + ' for ' + ' client';
        }  
    }
    else {
        // any block event, preparation time slots
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
