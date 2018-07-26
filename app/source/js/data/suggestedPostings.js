/**
 * Manages the user postings. GIG Postings made by the logged user.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/postings/suggested';
const LOCAL_KEY = 'suggestedPostings';
const ID_PROPERTY_NAME = 'userPostingID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/**
 * Provides access to the list of user postings.
 * @returns {CachedDataProvider<Array<rest/UserPosting>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: localListDriver
});

/**
 * Utility to run 'post methods' on a suggested posting, usually reaction
 * methods (apply, discard).
 * @param {string} action Action name (part of URL) to execute
 * @param {number} userPostingID
 * @param {object} data
 */
function postPostingReaction(action, userPostingID, data) {
    return rest.post(`${API_NAME}/${userPostingID}/${action}`, data)
    .then((r) => {
        list.invalidateCache();
        return r;
    });
}

/**
 * Let's a professional to apply to a user posting.
 * @param {number} userPostingID
 * @param {Object} data
 * @param {string} data.message Text to include for the potential client.
 */
export function applyToPoster(userPostingID, data) {
    return postPostingReaction('apply', userPostingID, data);
}

/**
 * Let's a professional to discard a user posting (gets hidden for itself).
 * @param {number} userPostingID
 */
export function discardPoster(userPostingID) {
    return postPostingReaction('discard', userPostingID);
}
