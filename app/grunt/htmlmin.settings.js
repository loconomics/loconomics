/**
 * Exports an object of common settings for htmlmin,
 * used directly by the htmlmin task and at browserify for the
 * stringify transform (that uses the same minifier internally, we need
 * to share the settings)
 */
'use strict';

module.exports = {
    collapseWhitespace: true,
    // keep 1 whitespace, since some elements may expect some space between them rather than rely on CSS margins
    conservativeCollapse: true,
    removeTagWhitespace: false,
    removeAttributeQuotes: true,
    removeComments: true,
    // ignore knockout comments
    ignoreCustomComments: [
        /^\s+ko/,
        /\/ko\s+$/
    ]
};
