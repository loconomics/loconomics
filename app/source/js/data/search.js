/**
 * Let searchs at the marketplace for service professionals,
 * job titles, search categories, by term and location.
 * Remote only (no cache, no local), once search at a time.
 */
'use strict';

var remote = require('./drivers/restClient');

/**
 * Default location used for searchs.
 * @member {number} lat
 * @member {number} lat
 * @member {number} searchDistance
 * @member {string} city
 */
exports.DEFAULT_LOCATION = {
    lat: '37.788479',
    lng: '-122.40297199999998',
    searchDistance: 30,
    city: 'San Francisco, CA USA'
};

var latestRequest = null;

/**
 * Search for service professionals, job titles and categories
 * at the marketplace.
 * @param {string} searchTerm Job title name or proffesional name
 * @param {number} [lat] Latitude of the location to find nearby
 * @param {number} [lng] Longitude of the location to find nearby
 * @param {number} [searchDistance] Nearby radius
 * @returns {Promise<SearchResult>} Plain object representing the
 * data of a model/SearchResult
 */
exports.search = function(searchTerm, lat, lng, searchDistance) {
    if (latestRequest) latestRequest.xhr.abort();

    latestRequest = remote.get('search', {
        searchTerm: searchTerm,
        origLat: lat || exports.DEFAULT_LOCATION.lat,
        origLong: lng || exports.DEFAULT_LOCATION.lng,
        searchDistance: searchDistance || exports.DEFAULT_LOCATION.searchDistance
    });
};
