/**
 * LocalForageSingleDataProviderDriver class, implementing an IDataProviderDriver
 * to access local data using a 'localforage' instance, focused on access a simple
 * endpoint, usually pointing to an index of elements (a list) as a whole
 * single thing, or just an object.
 *
 * It's straightforward, the most basic implementation but still highly reusable.
 */
export default class LocalForageSingleDataProviderDriver {
    /**
     * @param {Rest} localforage LocalForage instance properly set-up for a local cache.
     * @param {string} name Name of the key used to store the data
     */
    constructor(localforage, name) {
        this.fetch = function() {
            return localforage.getItem(name);
        };
        this.push = function(data) {
            return localforage.setItem(name, data);
        };
        this.delete = function() {
            return localforage.removeItem(name);
        };
    }
}
