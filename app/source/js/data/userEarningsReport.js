/**
 * Get reporting statistics from user earnings entries.
 */
import * as userEarnings from './userEarnings';
import $ from 'jquery';
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_BASE = 'me/earnings';
const API_NAME = API_BASE + '/report';
const LOCAL_KEY = 'earnings-report';
const API_NAME_DETAILED = API_BASE + '/detailed-report';

/**
 * Gives a report filtered by the given query data.
 * @returns {Promise<rest/UserExternalReport>}
 */
export function query(filters) {
    return rest.get(API_NAME, filters);
}

/**
 * Gives a report with the global results of the user (without filtering).
 * @returns {CachedDataProvider<rest/UserExternalReport>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export const globalReport = new CachedDataProvider({
    // 10 minutes
    ttl: 10 * 60 * 1000,
    remote: {
        fetch: () => rest.get(API_NAME)
    },
    local: new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY)
});

// Whenever a change is know in the data used to create the reports,
// we must invalidate the report data.
const invalidateReport = globalReport.invalidateCache.bind(globalReport);
userEarnings.list.onCacheChanged.subscribe(invalidateReport);
userEarnings.list.onCacheInvalidated.subscribe(invalidateReport);

/**
 * Gives a report filtered by the given query data just including data for
 * studends of CCC colleges for user allowed as admins
 * @returns {Promise<rest/UserExternalReport>}
 */
export function queryCccStudents(filters) {
    return rest.get(API_NAME + '/ccc', filters);
}

/**
 * Gives a detailed report filtered by the given query data just including data for
 * studends of CCC colleges for user allowed as admins
 * @returns {Promise<rest/UserExternalReport>}
 */
export function queryCccStudentsDetailed(filters) {
    return rest.get(API_NAME_DETAILED + '/ccc', filters);
}

/**
 * Gives an URL to the CSV version of the CCC students report with the given
 * filter and user authentication
 * @returns {string}
 */
export function getLinkToCsvCccReport(filters) {
    const url = API_NAME + '/ccc/csv?' + $.param(filters);
    return rest.baseUrl + url + '&auth=' + rest.extraHeaders.Authorization;
}

/**
 * Gives an URL to the CSV version of the CCC students detailed report with the given
 * filter and user authentication
 * @returns {string}
 */
export function getLinkToCsvCccDetailedReport(filters) {
    const url = API_NAME_DETAILED + '/ccc/csv?' + $.param(filters);
    return rest.baseUrl + url + '&auth=' + rest.extraHeaders.Authorization;
}
