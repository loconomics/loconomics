/**
 * Acccess available specializations.
 */
import rest from './drivers/restClient';

const API_NAME = 'specializations';

/**
 * Retrieves specializations given a search optimized for autocomplete
 * @param {string} searchTerm Partial or full name
 * @param {number} solutionID Filter by specific solution
 * @returns {Promise}
 */
export function specializationsAutocomplete(searchTerm, solutionID) {
    return rest.get(API_NAME, { searchTerm, solutionID });
}
