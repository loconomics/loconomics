/**
 * Access to the list of pricing types available,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

import CachedDataProvider from './helpers/CachedDataProvider';
import ListRemoteModel from './helpers/ListRemoteModel';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import PricingType from '../models/PricingType';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import remote from './drivers/restClient';
import session from './session';

const api = new ListRemoteModel({
    // Types does not changes usually, so big ttl
    listTtl: { days: 1 },
    itemIdField: 'pricingTypeID',
    Model: PricingType
});

module.exports = api;

api.addLocalforageSupport('pricing-types');
api.addRestSupport(remote, 'pricing-types');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

/**
 * Data provider for a list of pricing types available for a given job title ID.
 * @param {number} id Job Title ID
 * @returns {CachedDataProvider<Array<rest/PricingType>>}
 * Usage:
 * - const dataProvider = byJobTitleID(id);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
api.byJobTitle = function(id) {
    return new CachedDataProvider({
        // 1 day
        ttl: 1 * 24 * 60 * 60 * 1000,
        remote: new RestSingleDataProviderDriver(remote, 'pricing-types/job-title/' + id),
        local: new LocalForageSingleDataProviderDriver(localforage, 'pricing-types/job-title/' + id)
    });
};
