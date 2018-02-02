/**
 * manually testing CachedDataProvider
 */
/* eslint no-console:off */

import CachedDataProvider from './CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './LocalForageItemDataProviderDriver';
import LocalForageSingleDataProviderDriver from './LocalForageSingleDataProviderDriver';
import RestItemDataProviderDriver from './RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './RestSingleDataProviderDriver';
import localforage from '../drivers/localforage';
import rest from '../drivers/restClient';

// Usage example
export const apiItem = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestItemDataProviderDriver(rest, 'me/user-job-profile', 14),
    local: new LocalForageItemDataProviderDriver(localforage, 'user-job-profile', 14)
});

export const apiList = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, 'me/user-job-profile'),
    local: new LocalForageIndexedListDataProviderDriver(localforage, 'user-job-profile', 'jobTitleID')
});

export const apiSingle = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, 'me/payment-account'),
    local: new LocalForageSingleDataProviderDriver(localforage, 'payment-account')
});

function trySingle() {
    const loadSingle = () => {
        apiSingle.onceLoaded().then((data) => console.log('single data', data));
    };
    // Immediate, expected no cache
    loadSingle();
    // 6s delay, from cache (single has 1 minute ttl)
    setTimeout(loadSingle, 6000);
}

function tryItem() {
    let times = 1;
    apiItem.onData.subscribe((data) => console.log('item data', times++, data));
    apiItem.onDataError.subscribe((err) => console.log('item data err', err));
    // Try error. Small delay to prevent race conditions with running sync task
    setTimeout(function() {
        // break internals to force an error
        apiItem.__localCache.fetch = () => Promise.reject(new Error('test!'));
        // force onload
        apiItem.onData.subscribe((data) => console.log('item data', times++, data));
    }, 500);
}

function tryList() {
    const loadItem = () => {
        apiItem.__sync();
    };
    // Immediate, expected no cache
    loadItem();
    // 6s delay, from cache (has 1 minute ttl)
    setTimeout(loadItem, 6000);

    apiList.onceLoaded().then((data) => console.log('list data', data));
}

trySingle();
tryItem();
tryList();
