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
     */
    constructor(localforage, baseName, itemID) {
        this.fetch = function() {
            const name = baseName + '/' + itemID;
            return localforage.getItem(name);
        };
        this.push = function(data) {
            const name = baseName + '/' + itemID;
            return localforage.setItem(name, data);
        };
        this.delete = function() {
            const name = baseName + '/' + itemID;
            return localforage.removeItem(name);
        };
    }
}
