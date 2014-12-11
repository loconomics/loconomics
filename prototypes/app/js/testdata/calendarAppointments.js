/** Calendar Appointments test data **/
var Appointment = require('../models/Appointment');
var testLocations = require('./locations').locations;
var ko = require('knockout');

var testData = [
    new Appointment({
        startTime: new Date(2014, 11, 1, 10, 0, 0),
        endTime: new Date(2014, 11, 1, 12, 0, 0),
        pricingSummary: 'Deep Tissue Massage 120m plus 2 more',
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[0]),
        notesToClient: 'Looking forward to seeing the new color',
        notesToSelf: 'Ask him about his new color',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
    new Appointment({
        startTime: new Date(2014, 11, 1, 13, 0, 0),
        endTime: new Date(2014, 11, 1, 13, 50, 0),
        pricingSummary: 'Another Massage 50m',
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[1]),
        notesToClient: 'Something else',
        notesToSelf: 'Remember that thing',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
    new Appointment({
        startTime: new Date(2014, 11, 1, 16, 0, 0),
        endTime: new Date(2014, 11, 1, 18, 0, 0),
        pricingSummary: 'Tissue Massage 120m',
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[2]),
        notesToClient: '',
        notesToSelf: 'Ask him about the forgotten notes',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
];

exports.appointments = testData;
