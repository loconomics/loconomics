/**
 * Offers access to the app preset configuration options, read-only.
 * Is NOT meant for user settings.
 * Options are read on first use only (do not re-read from source beyond that)
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
 * Config object to be exported
 */
var config = {
    // It allows to be set in localStorage for development purposes
    get siteUrl() {
        return siteUrl;
    }
};

module.exports = config;
