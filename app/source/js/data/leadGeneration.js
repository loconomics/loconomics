/**
 * Provides methods to request subscriptions and make referrals from
 * lead generation components.
 */
'use strict';

var remote = require('./drivers/restClient');

/**
 * Let's an anonymous user to subscribe to the newsletter
 * @param {Object} data
 * @param {string} data.email
 * @param {boolean} data.isServiceProfessional
 * @returns {Promise}
 */
exports.subscribeNewsletter = function(data) {
    return remote.post('lead-generation/newsletter/subscribe', data);
};

/**
 * @typedef {Object} SubscriptionResult
 * @property {number} userID The generated ID for the new user
 */

/**
 * Let's an anonymous user to subscribe to perform a referral of a service
 * professional (it gets subscribed to newsletter additionally)
 * @param {Object} data
 * @param {string} data.email
 * @param {boolean} data.isServiceProfessional
 * @returns {Promise<SubscriptionResult>} Use the given userID value along with
 * the email provided to validate the requests for `updateSubscription`
 * and `referAServiceProfessional`
 */
exports.subscribeReferral = function(data) {
    return remote.post('lead-generation/referral/subscribe', data);
};

/**
 * Provides first and last name to a subscription previously generated as an
 * anonymous user
 * @param {Object} data
 * @param {number} data.userID ID from the result returned at `subscribeReferral`
 * @param {string} data.email Same email as used with `subscribeReferral`
 * @param {string} data.firstName
 * @param {string} [data.lastName]
 * @returns {Promise}
 */
exports.updateSubscription = function(data) {
    return remote.put('lead-generation/referral/subscribe', data);
};

/**
 * Provides information about a service professional
 * @param {Object} data
 * @param {string} [data.email] Service Professional email
 * @param {string} data.firstName Service Professional first name
 * @param {string} [data.lastName] Service Professional last name
 * @param {string} [data.phone] Service Professional phone number
 * @param {number} [data.referredByUserID] ID from the result returned at `subscribeReferral`
 * It's required for anonymous users
 * @param {string} [data.referredByEmail] Same email as used with `subscribeReferral`
 * It's required for anonymous users
 * @returns {Promise}
 */
exports.subscribeReferral = function(data) {
    return remote.post('lead-generation/referral/refer', data);
};
