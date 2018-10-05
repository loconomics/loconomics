/**
    List of activities to preload in the App (at main entry point 'app'),
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

module.exports = {
    'privacySettings': require('./activities/privacySettings'),
    'servicesOverview': require('./activities/servicesOverview'),
    'verifications': require('./activities/verifications'),
    'workPhotos': require('./activities/workPhotos'),
    'userFees': require('./activities/userFees'),
    'paymentAccount': require('./activities/paymentAccount'),
    'payoutPreference': require('./activities/payoutPreference'),
    'myAppointments': require('./activities/myAppointments'),
    'userFeePayments': require('./activities/userFeePayments'),
    'publicBio': require('./activities/publicBio'),
    'publicProfilePicture': require('./activities/publicProfilePicture'),
    'serviceProfessionalCustomURL': require('./activities/serviceProfessionalCustomURL'),
    'serviceProfessionalBusinessInfo': require('./activities/serviceProfessionalBusinessInfo'),
};
