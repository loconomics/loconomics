/**
 * Acccess available solutions, by searchSubCategoryID or by solutionID.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'solutions';
const LOCAL_KEY = 'solutions';
const ID_PROPERTY_NAME = 'solutionID';
const BY_SUB_CATEGORY_API_NAME = API_NAME + '/search-subcategory';
const BY_SUB_CATEGORY_LOCAL_KEY = 'searchSubCategoriesSolutions';
const BY_JOB_TITLE_API_NAME = API_NAME + '/job-title';
const BY_JOB_TITLE_LOCAL_KEY = 'jobTitleSolutions';

/**
 * Provides an API to fetch all solutions under a searchSubCategoryID.
 * @param {number} id The searchCategoryID
 * @returns {CachedDataProvider<Array<rest/Solution>>}
 * Usage:
 * - const dataProvider = bySearchSubcategoryID(searchCategoryID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function bySearchSubcategoryID(id) {
  return new CachedDataProvider({
      // 1 minutes
      ttl: 1 * 60 * 1000,
      remote: new RestItemDataProviderDriver(rest, BY_SUB_CATEGORY_API_NAME, id),
      local: new LocalForageSingleDataProviderDriver(localforage, BY_SUB_CATEGORY_LOCAL_KEY + '/' + id)
  });
}

/**
 * Provides an API to fetch all solutions suggested for a job title.
 * @param {number} id The jobTitleID
 * @returns {CachedDataProvider<Array<rest/Solution>>}
 * Usage:
 * - const dataProvider = byJobTitleID(jobTitleID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function byJobTitleID(id) {
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, BY_JOB_TITLE_API_NAME, id),
        local: new LocalForageSingleDataProviderDriver(localforage, BY_JOB_TITLE_LOCAL_KEY + '/' + id)
    });
}

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/Solution>}
 * Usage:
 * - const dataProvider = byCategoryID(solutionID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
  return new CachedDataProvider({
      // 1 minutes
      ttl: 1 * 60 * 1000,
      remote: new RestItemDataProviderDriver(rest, API_NAME, id),
      local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME)
  });
}

/**
 * Retrieves information for a job title search
 * @param {string} searchTerm job title search term to retrieve
 * @returns {Promise}
 */
export function solutionsAutocomplete(searchTerm) {
    return rest.get(API_NAME, { searchTerm });
}
