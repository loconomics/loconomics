/**
 * Settings for Aliasify, a Browserify transform.
 *
 * It's meant to be linked from package.json.
 * It changes depending on environment variables.
 */
'use strict';

/**
 * Detects if the 'dev' parameter was given at console, meaning that
 * settings must be prepared for development environment (files with debug
 * code/symbols versus files without debug/optimized)
 * @type {Boolean}
 */
var dev = !!~process.argv.indexOf('--dev');

const config = dev ? {} : {
    aliases: {
        'knockout': 'K'
    },
    verbose: false
};

module.exports = config;
