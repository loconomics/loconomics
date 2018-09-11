/**
    List of activities to preload in the App (at main entry point 'app'),
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

module.exports = {
    'serviceProfessionalService': require('./activities/serviceProfessionalService'),
    'serviceAddresses': require('./activities/serviceAddresses'),
    'login': require('./activities/login'),
    'logout': require('./activities/logout'),
    'signup': require('./activities/signup'),
    'schedulingPreferences': require('./activities/schedulingPreferences'),
    'privacySettings': require('./activities/privacySettings'),
    'serviceProfessionalServiceEditor': require('./activities/serviceProfessionalServiceEditor'),
    'servicesOverview': require('./activities/servicesOverview'),
    'verifications': require('./activities/verifications'),
    'licensesCertificationsForm': require('./activities/licensesCertificationsForm'),
    'workPhotos': require('./activities/workPhotos'),
    'payments': require('./activities/payments'),
    'userFees': require('./activities/userFees'),
    'performance': require('./activities/performance'),
    'searchJobTitle': require('./activities/searchJobTitle'),
    'searchCategory': require('./activities/searchCategory'),
    'paymentAccount': require('./activities/paymentAccount'),
    'payoutPreference': require('./activities/payoutPreference'),
    'myAppointments': require('./activities/myAppointments'),
    'viewBooking': require('./activities/viewBooking'),
    'mockupHouseCleanerServiceEditor': require('./activities/mockupHouseCleanerServiceEditor'),
    'userFeePayments': require('./activities/userFeePayments'),
    'ownerAcknowledgment': require('./activities/ownerAcknowledgment'),
    'upgrade': require('./activities/upgrade'),
    'listingEditor': require('./activities/listingEditor'),
    'publicBio': require('./activities/publicBio'),
    'publicProfilePicture': require('./activities/publicProfilePicture'),
    'serviceProfessionalCustomURL': require('./activities/serviceProfessionalCustomURL'),
    'serviceProfessionalBusinessInfo': require('./activities/serviceProfessionalBusinessInfo'),
    'userBirthDay': require('./activities/userBirthDay'),
    'listing': require('./activities/listing')
};
