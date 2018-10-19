/**
    List of activities to preload in the App (at main entry point 'app'),
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

module.exports = {
    'workPhotos': require('./activities/workPhotos'),
    'userFees': require('./activities/userFees'),
    'payoutPreference': require('./activities/payoutPreference'),
    'myAppointments': require('./activities/myAppointments'),
    'userFeePayments': require('./activities/userFeePayments'),
    'publicBio': require('./activities/publicBio'),
    'publicProfilePicture': require('./activities/publicProfilePicture'),
    'serviceProfessionalCustomURL': require('./activities/serviceProfessionalCustomURL'),
    'serviceProfessionalBusinessInfo': require('./activities/serviceProfessionalBusinessInfo'),
};
