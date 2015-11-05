/**
    TimeSlot view model (aka: CalendarSlot) for use
    as part of the template/component time-slot-tile or activities
    providing data for the template.
**/
'use strict';

var getObservable = require('../utils/getObservable');

function TimeSlotViewModel(params) {
    /*jshint maxcomplexity:9*/

    this.startTime = getObservable(params.startTime || null);
    this.endTime = getObservable(params.endTime || null);
    this.subject = getObservable(params.subject || null);
    this.description = getObservable(params.description || null);
    this.link = getObservable(params.link || null);
    this.actionIcon = getObservable(params.actionIcon || null);
    this.actionText = getObservable(params.actionText || null);
    this.classNames = getObservable(params.classNames || null);
}

module.exports = TimeSlotViewModel;

var numeral = require('numeral'),
    Appointment = require('../models/Appointment');

/**
    Static constructor to convert an Appointment model into 
    a TimeSlot instance following UI criteria for preset values/setup.
**/
TimeSlotViewModel.fromAppointment = function fromAppointment(apt) {
    /*jshint maxcomplexity:10 */
    
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
        classNames = 'Tile--tag-gray-lighter ';
    }
    else if (apt.id() > 0 && apt.sourceBooking()) {
        if (apt.sourceBooking().serviceDateID())
            classNames = 'Tile--tag-primary ' ;
        else
            // is a request:
            classNames = 'Tile--tag-warning ';
        
        classNames += 'ItemAddonTile--largerContent ';
    }
    else {
        // any block event, preparation time slots
        classNames = 'Tile--tag-danger ';
    }

    return new TimeSlotViewModel({
        startTime: apt.startTime,
        endTime: apt.endTime,
        subject: apt.summary,
        description: apt.description,
        link: link,
        actionIcon: (apt.sourceBooking() ? null : apt.sourceEvent() ? 'fa ion ion-ios-arrow-right' : !apt.id() ? 'fa ion ion-plus' : null),
        actionText: (
            apt.sourceBooking() && 
            apt.sourceBooking().pricingSummary() ? 
            numeral(apt.sourceBooking().pricingSummary().totalPrice() || 0).format('$0.00') :
            null
        ),
        classNames: classNames
    });
};
