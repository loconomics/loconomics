/**
    List of activities loaded in the App,
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

var Activity = require('./components/Activity');
var EmptyActivity = Activity.extend(function EmptyActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = {};
    this.navBar = Activity.createSectionNavBar();
});

module.exports = {
    '_test': EmptyActivity,
    '_styleGuide': require('./activities/_styleGuide'),
    '_modals': require('./activities/_modals'),
    'downloadApp': require('./activities/downloadApp'),
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker'),
    'clients': require('./activities/clients'),
    'serviceProfessionalService': require('./activities/serviceProfessionalService'),
    'serviceAddresses': require('./activities/serviceAddresses'),
    'dashboard': require('./activities/dashboard'),
    'appointment': require('./activities/appointment'),
    'login': require('./activities/login'),
    'logout': require('./activities/logout'),
    'signup': require('./activities/signup'),
    'welcome': require('./activities/welcome'),
    'addressEditor': require('./activities/addressEditor'),
    'account': require('./activities/account'),
    'inbox': require('./activities/inbox'),
    'conversation': require('./activities/conversation'),
    'help': require('./activities/help'),
    'feedbackForm': require('./activities/feedbackForm'),
    'contactForm': require('./activities/contactForm'),
    'cms': require('./activities/cms'),
    'clientEditor': require('./activities/clientEditor'),
    'schedulingPreferences': require('./activities/schedulingPreferences'),
    'calendarSyncing': require('./activities/calendarSyncing'),
    'bookMeButton': require('./activities/bookMeButton'),
    'ownerInfo': require('./activities/ownerInfo'),
    'privacySettings': require('./activities/privacySettings'),
    'addJobTitles': require('./activities/addJobTitles'),
    'serviceProfessionalServiceEditor': require('./activities/serviceProfessionalServiceEditor'),
    'marketplaceProfile': require('./activities/marketplaceProfile'),
    'marketplaceJobtitles': require('./activities/marketplaceJobtitles'),
    'servicesOverview': require('./activities/servicesOverview'),
    'verifications': require('./activities/verifications'),
    'education': require('./activities/education'),
    'backgroundCheck': require('./activities/backgroundCheck'),
    'educationForm': require('./activities/educationForm'),
    'bookingPolicies': require('./activities/bookingPolicies'),
    'licensesCertifications': require('./activities/licensesCertifications'),
    'licensesCertificationsForm': require('./activities/licensesCertificationsForm'),
    'workPhotos': require('./activities/workPhotos'),
    'profile': require('./activities/profile'),
    'home': require('./activities/home'),
    'learnMoreProfessionals': require('./activities/learnMoreProfessionals'),
    'booking': require('./activities/booking'),
    'terms': require('./activities/terms'),
    'about': require('./activities/about'),
    'payments': require('./activities/payments'),
    'userFees': require('./activities/userFees'),
    'performance': require('./activities/performance'),
    'searchJobTitle': require('./activities/searchJobTitle'),
    'searchCategory': require('./activities/searchCategory'),
    'boardMemberNominations': require('./activities/boardMemberNominations'),
    'paymentAccount': require('./activities/paymentAccount'),
    'myAppointments': require('./activities/myAppointments'),
    'clientAppointment': require('./activities/clientAppointment'),
    'viewBooking': require('./activities/viewBooking'),
    'blog': require('./activities/blog'),
    'ownerPerks': require('./activities/ownerPerks'),
    'cancellationPolicies': require('./activities/cancellationPolicies'),
    'mockupHouseCleanerServiceEditor': require('./activities/mockupHouseCleanerServiceEditor'),
    'aboutMe': require('./activities/aboutMe'),
    'onboardingSuccess': require('./activities/onboardingSuccess'),
    'userFeePayments': require('./activities/userFeePayments'),
    'ownerAcknowledgment': require('./activities/ownerAcknowledgment'),
    'userProfile': require('./activities/userProfile'),
    'upgrade': require('./activities/upgrade'),
    'listingEditor': require('./activities/listingEditor'),
    'publicContactInfo': require('./activities/publicContactInfo'),
    'publicBio': require('./activities/publicBio'),
    'publicProfilePicture': require('./activities/publicProfilePicture'),
    'serviceProfessionalCustomURL': require('./activities/serviceProfessionalCustomURL'),
    'serviceProfessionalBusinessInfo': require('./activities/serviceProfessionalBusinessInfo'),
    'userBirthday': require('./activities/userBirthday')
};
