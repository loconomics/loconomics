/**
 * LocalForageItemDataProviderDriver class, implementing an IDataProviderDriver
 * to access local data using a 'localforage' instance, focused on indexed item access
 * by its ID.
 */
export default class LocalForageItemDataProviderDriver {
    /**
     * @param {Rest} localforage LocalForage instance properly set-up for a local cache.
     * @param {string} baseName Name of the key used to store the item that
     * will be augmented with the itemID
     * @param {(string|number)} itemID The ID or index key of the item managed.
     * @param {string} [idPropertyName] The name of the property that holds
     * the itemID in the data. This field is optional because for fetch, update
     * (push with existent item) and delete operations is not needed, but is
     * required when there is no an itemID upfront since we are requesting
     * creation of a new item, and the ID will only exists AFTER an insert
     * operation (push without ID). If itemID is empty (null, undefined
     * or empty string; 0 will be valid to support special ID:0 cases) and an
     * idPropertyName is not provided, this will throw immediately.
     */
    constructor(localforage, baseName, itemID, idPropertyName) {
        const isEmptyID = (itemID === null || itemID === undefined || itemID === '');
        if (isEmptyID && !idPropertyName) {
            throw new Error('No itemID and no idPropertyName; once of both is needed');
        }
        this.fetch = function() {
            const name = baseName + '/' + itemID;
            return localforage.getItem(name);
        };
        this.push = function(cache) {
            const name = baseName + '/' + (isEmptyID ? cache.data[idPropertyName] : itemID);
            return localforage.setItem(name, cache);
        };
        this.delete = function() {
            const name = baseName + '/' + itemID;
            return localforage.removeItem(name);
        };
    }
}
