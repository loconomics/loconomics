/**
 * Acccess available specializations.
 */
import rest from './drivers/restClient';

const API_NAME = 'specializations';

/**
 * Retrieves specializations given a search optimized for autocomplete
 * @param {string} searchTerm Partial or full name
 * @returns {Promise}
 */
export function specializationsAutocomplete(searchTerm) {
    return rest.get(API_NAME, { searchTerm });
}
