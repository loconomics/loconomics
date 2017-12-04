/**
 * Settings for Stringify, a Browserify transform.
 *
 * It's meant to be linked from package.json, and uses shared htmlmin settings.
 */
'use strict';

module.exports = {
    appliesTo: { includeExtensions: ['.html'] },
    minify: true,
    minifyAppliesTo: { includeExtensions: ['.html'] },
    minifyOptions: require('./htmlmin.settings')
};
