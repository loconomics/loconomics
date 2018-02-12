/**
 * Get reporting statistics from user earnings entries.
 */
import * as userEarnings from './userEarnings';
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/earnings/report';
const LOCAL_KEY = 'earnings';

/**
 * Gives a report with the global results of the user (without filtering).
 * @returns {CachedDataProvider<rest/UserExternalReport>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export const globalReport = new CachedDataProvider({
    // 10 minutes
    ttl: 10 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY)
});

// Whenever a change is know in the data used to create the reports,
// we must invalidate the report data.
const invalidateReport = globalReport.invalidateCache.bind(globalReport);
userEarnings.list.onCacheChanged.subscribe(invalidateReport);
userEarnings.list.onCacheInvalidated.subscribe(invalidateReport);
