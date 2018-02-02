/**
 * RestItemDataProviderDriver class, implementing an IDataProviderDriver
 * to access remote data using a REST client, focused on indexed item access
 * by its ID.
 */
export default class RestItemDataProviderDriver {
    /**
     * @param {Rest} restClient REST client properly set-up with for the remote
     * @param {string} indexUrl Fragment of a URL, that builds on top of the
     * REST client baseUrl and that will be augmented when needed with the
     * itemID; so, it must point to the index or list that contains the item.
     * @param {(string|number)} itemID The ID or index key of the item managed.
     */
    constructor(restClient, indexUrl, itemID) {
        this.fetch = function() {
            const url = indexUrl + '/' + itemID;
            return restClient.get(url);
        };
        this.push = function(data) {
            const method = itemID ? 'put' : 'post';
            const url = indexUrl + (
                itemID ? '/' + itemID : ''
            );
            return restClient[method](url, data);
        };
        this.delete = function() {
            return restClient.delete(indexUrl + '/' + itemID);
        };
    }
}
