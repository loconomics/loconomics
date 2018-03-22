/**
 * Access data attached to Badges URLs based on [OpenBadges standard](https://openbadges.org/)
 * and [Badgr.io service](https://info.badgr.io/).
 *
 * @module data/badges
 */
import Rest from '../utils/Rest';

// Rest client user for every request
const rest = new Rest('');
// Even if the REST client already request for JSON, it has additional values for accepted content,
// and with Badgr.io endpoints it fails cause of CORS. Being explicit about ONLY JSON accepted fixed it.
rest.extraHeaders = {
    'Accept': 'application/json'
};

/**
 * Regular expression used to detect the version parameter in a URL
 * @const {RegExp}
 */
const urlVersionExp = /\?v=.+$/;

/**
 * Fixes a URL to request a version 2 of the OpenBadges spec.
 * Required since some endpoints for v2 returns URLs in data pointing to the wrong
 * version, like the 'badge' URL in the assertion data.
 * @param {string} url
 * @returns {string} The URL fixed
 */
const fixUrlVersion = (url) => url.replace(urlVersionExp, '?v=2_0');

/**
 * Fetchs a JSON from the given URL, expected to have info about a badge assigned to
 * an user (assertion), general badge information, collection of badges.
 * @param {string} url Full URL
 * @returns {Promise<any>}
 */
export function fetchFrom(url) {
    return rest.get(fixUrlVersion(url));
}

/**
 * Defines an assertion where the badge property (originally a URL string) is
 * replaced with the full BadgeClass definition. See the OpenBadges V2 spec
 * for full details of the base types
 * @typedef {OpenBadgesV2/Assertion} ExpandedAssertion
 * @property {OpenBadgesV2/BadgeClass} badge
 */

/**
 * Get the data for an Assertion plus the BadgeClass that belongs to it, replacing in the
 * returned assertion data the 'bagde' property with the object representing the BadgeClass
 * (rather than the URL string that comes there; that URL is still available at 'badge.id')
 * @param {string} url URL to an Assertion (the recognition of a badge issued to a person)
 * @returns {Promise<ExpandedAssertion>}
 */
export function getAssertion(url) {
    return fetchFrom(url)
    .then((assertion) => fetchFrom(assertion.badge).then((badgeClass) => {
        // Replace URL with full object
        assertion.badge = badgeClass;
        // Return augmented data:
        return assertion;
    }));
}
