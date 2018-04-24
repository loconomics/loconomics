/**
 * Data module to manage data relative to an user.
 *
 * There is no cache.
 */

import { expandUserBadges } from './userBadges';
import rest from './drivers/restClient';

/**
 * @param {number} userID
 * @returns {Promise<rest/UserBadge>}
 */
export function getBadges(userID) {
    return rest.get(`admin/users/${userID}/badges`).then(expandUserBadges);
}

/**
 * @param {rest/UserBadge} userBadge
 * @returns {Promise<rest/UserBadge>}
 */
export function setBadge(userBadge) {
    return rest.post(`admin/users/${userBadge.userID}/badges`, userBadge);
}
