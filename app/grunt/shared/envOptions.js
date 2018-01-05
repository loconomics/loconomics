/**
 * Provides shortcuts to check for common environment/cli options
 *
 * NOTE: Grunt has an API to easy check that, but some modules/settings works
 * outside the Grunt context
 */
'use strict';

/**
 * Detects if the 'development' environment is set, meaning that
 * @returns {Boolean}
 */
exports.inDev = function() {
    // CLI option
    if (~process.argv.indexOf('--dev')) {
        return true;
    }
    // ENV option
    else {
        return process.env.NODE_ENV === 'development';
    }
};
