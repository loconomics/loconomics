/**
 * Exports an object of common settings for cssmin (formerly, clean-css),
 * used directly by the cssmin task and at browserify for the
 * postcss-clean (post-css plugin added to Stylus through stylify)
 */
'use strict';

module.exports = {
    // Remove all but first 'banner' comment
    specialComments: 1,
    report: 'min',
    level: 2
};
