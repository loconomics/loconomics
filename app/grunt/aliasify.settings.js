/**
 * Settings for Aliasify, a Browserify transform.
 *
 * It's meant to be linked from package.json.
 * It changes depending on environment variables.
 */
'use strict';

var envOptions = require('./shared/envOptions');

/**
 * Settings must be prepared for development environment (files with debug
 * code/symbols versus files without debug/optimized)
 * @type {Boolean}
 */
var dev = envOptions.inDev();

const config = dev ? {} : {
    aliases: {
        'knockout': 'K'
    },
    verbose: false
};

module.exports = config;
