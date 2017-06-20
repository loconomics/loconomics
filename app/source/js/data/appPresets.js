/**
 * Offers access to the app preset configuration options, read-only.
 * Is NOT meant for user settings or variable options.
 * Options are read on first use only (do not re-read from source beyond that)
 * @module data/appPresets
 */
'use strict';

/// Defining internal utilities

/**
 * It detects old set-up of config for the siteUrl and
 * migrates that to the current one.
 *
 * THIS IS TEMPORARY CODE
 * @private
 */
function migrateConfig() {
    var config = localStorage["LoconomicsApp/config"];
    if (config) {
        try {
            config = JSON.parse(config);
            localStorage.siteUrl = config.siteUrl;
            // Disabled for now, before reach master, to allow to go back to
            // previous set-up at other branches
            //delete localStorage["LoconomicsApp/config"];
        }
        catch(ex) { }
    }
}

/**
 * Retrives from app configuration the siteUrl, needed
 * as prefix of the REST calls.
 * @private
 */
function getSiteUrl() {
    // Local Storage config takes precedence
    var siteUrl = '';

    // It allows to be set in localStorage for development purposes
    if (localStorage.siteUrl) {
        siteUrl = localStorage.siteUrl;
        // Overwrite preset attribute
        document.documentElement.setAttribute('data-site-url', siteUrl);
    }
    else {
        siteUrl = document.documentElement.getAttribute('data-site-url') || '';
    }
    return siteUrl;
}

/// Init tasks and retrieve values
migrateConfig();
var siteUrl = getSiteUrl();

/**
 * Object to be exported
 * with read-only properties
 */

module.exports = {
    /**
     * Gives the site URL, that is preset to non empty
     * if is different than the current environment URL
     * (empty on website server, non empty on
     * native app, file protocol, dev environment).
     * Used to create links to remote site or perform
     * REST API requests.
     * When empty string, is expected to be used as is
     * since works fine as relative URL.
     * @member {string}
     */
    get siteUrl() {
        return siteUrl;
    }
};
