/**
 * Keeps an index (or registry) of loaded activities.
 * It allows activities to register themselves, so are recognized by the app,
 * the app to query them and the app entry points to preload activities.
 */

import Activity from '../components/Activity';

function createRedirect(toPath) {
    return class Redirect extends Activity {
        static get template() { return ''; }

        show(state) {
            // Path should be the place we redirect to plus any
            // parameters/path attached to it (usually, redirects
            // are a name change and keep positional and named parameters
            // otherwise a specilized redirect should be created if
            // full compatibility is wanted)
            const fullPath = toPath +
                (state.route.path || '') +
                state.route.query.rawOriginalQuery;
            setTimeout(() => this.app.shell.go(fullPath, state, true), 10);
        }
    };
}

/**
 * Index/registry of available activity classes, as a dictionary where
 * the key is the activity route name and the class (AKA controller) the value.
 * It includes redirections too
 * @private {Object}
 */
const activities = {
    'publicContactInfo': createRedirect('public-contact-info'),
    'userProfile': createRedirect('user-profile'),
    'downloadApp': createRedirect('download-app'),
    'learnMoreProfessionals': createRedirect('learn-more-professionals'),
    'addJobTitle': createRedirect('add-job-title'),
    'addressEditor': createRedirect('address-editor'),
    'backgroundCheck': createRedirect('background-check'),
    'bookingPolicies': createRedirect('booking-policies'),
    'bookMeButton': createRedirect('book-me-button'),
    'datetimePicker': createRedirect('datetime-picker'),
    'calendarSyncing': createRedirect('calendar-syncing'),
    'cancellationPolicies': createRedirect('cancellation-policies'),
    'clientAppointment': createRedirect('client-appointment'),
    'clientEditor': createRedirect('client-editor'),
    'contactForm': createRedirect('contact-form'),
    'educationForm': createRedirect('education-form'),
    'feedbackForm': createRedirect('feedback-form'),
    'licensesCertifications': createRedirect('licenses-certifications'),
    'licensesCertificationsForm': createRedirect('licenses-certifications-editor'),
    'listingEditor': createRedirect('listing-editor'),
    'viewBooking': createRedirect('view-booking'),
    'searchJobTitle': createRedirect('search-job-title'),
    'searchCategory': createRedirect('search-category'),
    'userBirthDay': createRedirect('user-birth-day'),
    'schedulingPreferences': createRedirect('scheduling-preferences'),
    'ownerAcknowledgment': createRedirect('owner-acknowledgment'),
    'serviceProfessionalService': createRedirect('service-professional-service'),
    'serviceProfessionalServiceEditor': createRedirect('service-professional-service-editor'),
    'serviceAddresses': createRedirect('service-addresses'),
    'servicesOverview': createRedirect('services-overview'),
    'paymentAccount': createRedirect('payment-account'),
    'privacySettings': createRedirect('privacy-settings'),
    'workPhotos': createRedirect('work-photos'),
    'userFees': createRedirect('user-fees'),
    'payoutPreference': createRedirect('payout-preference'),
    'myAppointments': createRedirect('my-appointments'),
    'userFeePayments': createRedirect('user-fee-payments'),
    'publicBio': createRedirect('public-bio'),
    'publicProfilePicture': createRedirect('public-profile-picture'),
    'serviceProfessionalCustomURL': createRedirect('service-professional-custom-url'),
    'serviceProfessionalBusinessInfo': createRedirect('service-professional-business-info'),
};

/**
 * Register an activity for a route name.
 * @member {string} routeName The initial path in the URL that points to the
 * activity, SHOULD NOT include a path separator ('/'). Usually the same name
 * as the activity
 * @member {Activity} ActivityClass Class inherit from Activity to implement
 * the route.
 */
export function register(routeName, ActivityClass) {
    activities[routeName] = ActivityClass;
}

/**
 * Get the activity class for the given name.
 * @param {string} routeName Route or activity name
 * @returns {Activity} Null if doesn't exists.
 */
export function get(routeName) {
    return activities[routeName];
}
