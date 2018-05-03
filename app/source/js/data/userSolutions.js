/**
 * Access the search subcategories list available by searchCategoryID.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/solutions';
const API_BY_LISTING = API_NAME + '/listing';
const LOCAL_KEY = 'userListingSolutions';

export function byUserListing(id) {
    const localItemDriver = new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY + '/' + id);
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_BY_LISTING, id),
        local: localItemDriver
    });
}
