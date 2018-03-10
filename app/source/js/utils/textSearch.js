/**
    Small utility to search a text fragment using
    case insensitive, accent/symbol insensitive.
**/
'use strict';

var removeAccent = require('./removeAccent');

module.exports = function textSearch(search, text) {

    var s = removeAccent(search || '').toLowerCase();
    var t = removeAccent(text || '').toLowerCase();

    return t.indexOf(s) > -1;
};

/**
 * Partial search of any term in the list at each element in the content list,
 * if just one matches, it returns true
 * @param {Array<string>} preparedList A list of search terms previously prepared
 * for case and accent insensitive
 * @param {Array<string>} textList
 * @returns {boolean}
 * @private
 */
const searchAnyAt = function(preparedTerm, contentList) {
    return preparedTerm.some((term) => contentList.some((text) => {
            var t = removeAccent(text || '').toLowerCase();
            return t.indexOf(term) > -1;
        })
    );
};

/**
 * Partial search of all terms in the list at each element in the content list,
 * if just one matches, it returns true
 * @param {Array<string>} preparedList A list of search terms previously prepared
 * for case and accent insensitive
 * @param {Array<string>} textList
 * @returns {boolean}
 * @private
 */
const searchAllAt = function(preparedTerm, contentList) {
    return !preparedTerm.some((term) => !contentList.some((text) => {
            var t = removeAccent(text || '').toLowerCase();
            return t.indexOf(term) > -1;
        })
    );
};

/**
 * Get a list of words in the given text
 * @param {string} text
 * @return {Array<string>}
 */
const getWords = function(text) {
    // Splits a text by word boundaries, and filters each piece to
    // just only words are included (removes spaces and other separators)
    return text.split(/\b/).filter((piece) => /\w/.test(piece));
};

/**
 * Prepares a text for casing and accent independent search, returning the
 * API that allows to search at given data.
 * @param {string} searchTerm Text to look for
 * @return {Object} Search object
 */
module.exports.searchFor = function(searchTerm) {
    var terms = getWords(removeAccent(searchTerm || '').toLowerCase());
    return {
        /**
         * Partial search at each given element, if just one matches,
         * it returns true
         * @param {Array<string>} textList
         * @returns {boolean}
         */
        anyAt: function(textList) {
            return searchAnyAt(terms, textList);
        },
        /**
         * Partial search at each word contained in the given text, if just
         * one word matches it returns true
         * @param {string} text
         * @returns {boolean}
         */
        anyAtWords: function(text) {
            return searchAnyAt(terms, getWords(text));
        },
        /**
         * Partial search at each given element, if just one matches,
         * it returns true
         * @param {Array<string>} textList
         * @returns {boolean}
         */
        allAt: function(textList) {
            return searchAllAt(terms, textList);
        },
        /**
         * Partial search at each word contained in the given text, if just
         * one word matches it returns true
         * @param {string} text
         * @returns {boolean}
         */
        allAtWords: function(text) {
            return searchAllAt(terms, getWords(text));
        }
    };
};
