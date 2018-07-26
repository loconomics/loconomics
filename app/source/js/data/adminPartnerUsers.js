/**
 * Access to the list of partner users.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'admin/partner-users';

/**
 * Provides access to the list of all platform users.
 * @param {string} partner
 * @returns {CachedDataProvider<Array<rest/PartnerUser>>}
 * Usage:
 * - const list = listByPartner('a')
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function listByPartner(partner) {
    const key = API_NAME + '/' + partner;
    return new CachedDataProvider({
        // 2 minutes
        ttl: 2 * 60 * 1000,
        remote: new RestSingleDataProviderDriver(rest, key),
        local: new LocalForageIndexedListDataProviderDriver(localforage, key, 'userID')
    });
}
