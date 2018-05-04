/**
 * Data module to manage data relative to an user.
 *
 * There is no cache.
 */

import { expandUserBadges } from './userBadges';
import rest from './drivers/restClient';

/**
 * @param {number} userID
 * @returns {Promise<Array<data/userBadges/UserBadgeAssertion>>}
 */
export function getBadges(userID) {
    return rest.get(`admin/users/${userID}/badges`).then(expandUserBadges);
}

/**
 * @param {number} userID
 * @param {number} userBadgeID
 * @returns {Promise<rest/UserBadge>}
 */
export function getBadge(userID, userBadgeID) {
    return rest.get(`admin/users/${userID}/badges/${userBadgeID}`);
}

/**
 * @param {rest/UserBadge} userBadge
 * @returns {Promise<rest/UserBadge>}
 */
export function setBadge(userBadge) {
    if (userBadge.userBadgeID) {
        return rest.put(`admin/users/${userBadge.userID}/badges/${userBadge.userBadgeID}`, userBadge);
    }
    else {
        return rest.post(`admin/users/${userBadge.userID}/badges`, userBadge);
    }
}

/**
 * @param {rest/UserBadge} userBadge
 * @returns {Promise<rest/UserBadge>}
 */
export function deleteBadge(userBadge) {
    return rest.delete(`admin/users/${userBadge.userID}/badges/${userBadge.userBadgeID}`);
}
