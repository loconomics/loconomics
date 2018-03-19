/**
 * LocalForageIndexedListDataProviderDriver class, implementing an IDataProviderDriver
 * to access local data using a 'localforage' instance, focused on access an
 * indexed list of objects.
 * The strategy is to store as many keys as elements in the list plus an index.
 * The index will contain an array of IDs (under key: baseName plus trailing slash)
 * Each element is referenced by its ID (under ky: baseName plus slash plus ID),
 * so it allows for a direct access (indexed); this individually stored elements
 * can be managed by another 'item' data provider (is fast to access a single
 * item, versus the strategy of using a 'single' provider that holds the original
 * list, that means an overload of getting the full list and search for the element
 * each time an element is accessed).
 *
 * IMPORTANT: As described above, is expected to use this along another
 * data provider for 'items', and in order to work correctly the same baseName
 * and [baseName + / + ID] keys must be used there (is the pattern used at
 * LocalForageItemDataProviderDriver, a good fit)
 *
 * IMPORTANT: Additionally to interface methods, additional ones are added
 * only for advanced use needed to keep 'item providers' in sync with this
 * 'list provider'; all ones dedicated to manipulate the registry/index.
 *
 * IMPORTANT: While 'DataProviderDrivers' usually don't need to know about the
 * scheme of the data being stored, this case is special and needs to deal
 * with the content. It's important to know that this is built for DataProvider
 * expecting a CachedData object in the cache; it's a simple structure that
 * includes cache metadata, that we must keep 'as is' or just copy it, and
 * a `data` property holding the actual, raw, data (we will deal mostly with
 * this to transform the list of objects into list of IDs and store every object
 * under an indexted item key).
 */
export default class LocalForageIndexedListDataProviderDriver {
    /**
     * @param {Rest} localforage LocalForage instance properly set-up for a local cache.
     * @param {string} baseName Base name of the keys used to store the data,
     * augmented with index indicator and IDs for each elements.
     * @param {string} idPropertyName Name of the property shared by all
     * items containing the unique ID.
     */
    constructor(localforage, baseName, idPropertyName) {
        /**
         * Gets the storage key of an item by ID
         * @param {(string|number)} id ID of an item
         * @returns {string}
         */
        const itemKey = (id) => baseName + '/' + id;
        /**
         * Storage key for the list index (holding an array of IDs)
         * @const {string}
         */
        const listIndexKey = baseName + '/';

        /**
         * Read the list index cache
         * @returns {Promise<CachedData>}
         * @private
         */
        const readIndex = function() {
            return localforage.getItem(listIndexKey);
        };
        /**
         * Writes the list index cache, providing the list index separated
         * as it will create a new cache object without modifying the original.
         * @param {CachedData} cache
         * @param {Array<number>} index Raw data, the list index (of IDs)
         * @returns {Promise}
         * @private
         */
        const writeIndex = function(cache, index) {
            return localforage.setItem(listIndexKey, Object.assign({}, cache, { data: index }));
        };

        /**
         * Adds an ID to the list index (if didn't existed -dupes are avoided).
         * Use carefull, since touching the 'registry' without having a related
         * store key with that ID will produce errors.
         * @param {number} id
         * @returns {Promise}
         */
        this.registerID = function(id) {
            return readIndex()
            .then((cache) => {
                // If not registered
                if (!~cache.data.indexOf(id)) {
                    // Add to list and write
                    return writeIndex(cache, cache.data.concat(id));
                }
            });
        };

        /**
         * Removes an ID from the list index.
         * Use carefull, since touching the 'registry' without having a related
         * store key with that ID will produce errors.
         * @param {number} id
         * @returns {Promise}
         */
        this.unregisterID = function(id) {
            return readIndex()
            .then((cache) => {
                // If registered
                const i = cache.data.indexOf(id);
                if (~i) {
                    cache.data.splice(i, 1);
                    return writeIndex(cache, cache.data);
                }
            });
        };

        /**
         * Get the list of items; it will contain the full items, resolving
         * from the stored IDs into the item data.
         * @returns {Promise<CachedData,Error>}
         */
        this.fetch = function() {
            return readIndex()
            .then((cache) => {
                // index is, if any, array of keys/IDs
                if (cache && cache.data) {
                    const index = cache.data;
                    // Get all local items from the array
                    // Basically, resolving IDs into its values
                    return Promise.all(index.map((id) => localforage.getItem(itemKey(id))))
                    // We must return a new CachedData-like object, including the
                    // original cache metadata but with data being an array of all items
                    .then((all) => (Object.assign({}, cache, {
                        // We filter by checking if there is cached data for the item
                        // (this prevents from throwing on cases where there is a desynchronization
                        // between records and index, as a non notified deletion of an item,
                        // letting us protect better from corrupted data and bugs)
                        // and map the content data from the cache as the item to hold
                        // in the returning list.
                        data: all.filter((item) => !!(item && item.data)).map((item) => item.data)
                    })));
                }
                else {
                    return undefined;
                }
            });
        };
        /**
         * Store a list of items as an array of IDs in the index and individual
         * keys for items.
         * @param {CachedData} cache
         * @returns {Promise}
         */
        this.push = function(cache) {
            const { data: list } = cache;
            // Wrap around a promise even if synchronous, to properly reject rather than throw
            // in case of error (easily can happens when trying to store an empty item --not allowed).
            const storeItems = new Promise((resolve) => {
                // Store every item on it's own indexed key
                // generating a new CachedData-like object, including the original list cache metadata
                const tasks = list.map((item) => localforage.setItem(itemKey(item[idPropertyName]), Object.assign({}, cache, {
                    data: item
                })));
                resolve(tasks);
            });
            return storeItems.then((all) => Promise.all(all))
            // and the list of IDs on the index,
            // as a CachedData-like object that includes original cache metadata
            .then(() => writeIndex(cache, list.map((item) => item[idPropertyName])));
        };
        /**
         * Delete the whole list: the index and each stored list.
         * It's unusual for an API of type 'list' to allow removal (on the remote),
         * here we support not only for edge cases allowing it but too to support
         * clearing the local cache.
         * @returns {Promise}
         */
        this.delete = function() {
            // Get the index
            return localforage.getItem(listIndexKey)
            .then(({ data: index } = {}) => {
                if (index) {
                    // Remove all local items found in the array
                    return Promise.all(index.map((id) => localforage.removeItem(itemKey(id))));
                }
                // else No index, expected no items, no work to do
            })
            // Finally, remove the index too
            .then(() => localforage.removeItem(listIndexKey));
        };
    }
}
