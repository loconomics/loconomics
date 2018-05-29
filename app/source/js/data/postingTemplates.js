/**
 * Access posting templates.
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'posting-templates';
const LOCAL_KEY = 'postingTemplates';
const ID_PROPERTY_NAME = 'postingTemplateID';

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/PostingTemplate>}
 * Usage:
 * - const dataProvider = item(id);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    return new CachedDataProvider({
        // 1 day
        ttl: 1 * 24 * 60 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME)
    });
}
