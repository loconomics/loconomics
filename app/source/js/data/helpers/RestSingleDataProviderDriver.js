/**
 * RestSingleDataProviderDriver class, implementing an IDataProviderDriver
 * to access remote data using a REST client, focused on access a simple
 * endpoint, usually pointing to an index of elements (a list) as a whole
 * single thing, or just an object.
 *
 * It's straightforward, the most basic implementation but still highly reusable.
 */
export default class RestSingleDataProviderDriver {
    /**
     * @param {Rest} restClient REST client properly set-up with for the remote
     * @param {string} endpointUrl Fragment of a URL, that builds on top of the
     * REST client baseUrl and points to the data.
     */
    constructor(restClient, endpointUrl) {
        this.fetch = function() {
            return restClient.get(endpointUrl);
        };
        this.push = function(data) {
            return restClient.put(endpointUrl, data);
        };
        this.delete = function() {
            return restClient.delete(endpointUrl);
        };
    }
}
