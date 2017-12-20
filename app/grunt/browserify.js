/**
 * Browserify tasks: create javascript bundles.
 * We are using several transforms, plugins and advanced features.
 *
 * Using 'factor-bundle' to split the final file in several files (bundles),
 * moving common modules (and rarely updated) to a 'common' file and keeping
 * separated entry points smaller.
 *
 * Using 'exorcise' to extract the 'source map' of each bundle to another file
 *
 * Using 'common-shakeify' to remove 'dead code' because of unused modules
 * features (also called 'tree shaking'; not to confuse with the kind of removal
 * of 'dead code' done by uglify and warned by linting --that we should prevent)
 */
'use strict';
var merge = require('deepmerge');
var notify = require('grunt-notify/lib/notify-lib');
var notifySettings = require('./notify.js');
// Using exorcist to extract source-maps from files.
// We use the API directly rather than the 'grunt-exorcise'
// (used in the past, removed when commiting this comment)
// because is the only way to make it works with watch[ify] option.
var exorcist = require('exorcist');
var browserifyBundles = require('./shared/browserifyBundles');
require('common-shakeify');

module.exports = function(grunt) {
    /// External parameters
    /**
     * Whether enable the fullPaths option in Browserify.
     * False by default, useful to be enabled when the result needs to be
     * analyzed with tools like 'discify'.
     * @private {Boolean}
     */
    var fullPaths = !!grunt.option('fullPaths');
    /**
     * Whether current environment is 'development', in order to enable
     * features like source-maps (Browserify debug mode).
     * IMPORTANT: This parameter is shared with other tasks and settings, should
     * keep the same on every use for consistent results (see '--dev').
     * @private {Boolean}
     */
    var dev = !!grunt.option('dev');
    /**
     Browserify config
     **/
    var bconfig = {};

    // Constants defining the source and destination paths for the
    // files involved in the appCommon set-up
    /**
     * Destination for the common modules file.
     * It's the main target for the Browserify task.
     */
    var COMMON_DEST = './build/assets/js/common.js';
    /**
     * Destintation for the common modules source-map file.
     */
    var COMMON_DEST_MAP = COMMON_DEST + '.map';
    /**
     * Source of the App bundle
     */
    var APP_SOURCE = './source/js/app.js';
    /**
     * Destination of the App bundle
     */
    var APP_DEST = './build/assets/js/app.js';
    /**
     * Destintation for the App bundle source-map file.
     */
    var APP_DEST_MAP = APP_DEST + '.map';
    /**
     * Source of the Landing Page bundle
     */
    var LANDING_PAGE_SOURCE = './source/js/landingPage.js';
    /**
     * Destination of the Landing Page bundle.
     * Renamed as 'welcome' for the result file.
     */
    var LANDING_PAGE_DEST = './build/assets/js/welcome.js';
    /**
     * Destintation for the Landing Page bundle source-map file.
     */
    var LANDING_PAGE_DEST_MAP = LANDING_PAGE_DEST + '.map';

    // Utility to send a desktop notification
    var sendRebuildNotification = function() {
        notify(notifySettings.browserify.options);
    };

    /**
        Generates the [app, landingPage] bundles,
        extracting the common parts out.
    **/
    var appCommonBaseSettings = browserifyBundles.create(
        grunt, {
            dest: COMMON_DEST,
            map: dev && COMMON_DEST_MAP
        }, [{
            source: APP_SOURCE,
            dest: APP_DEST,
            map: dev && APP_DEST_MAP
        }, {
            source: LANDING_PAGE_SOURCE,
            dest: LANDING_PAGE_DEST,
            map: dev && LANDING_PAGE_DEST_MAP
        }],
        sendRebuildNotification
    );
    bconfig.appCommon = merge(appCommonBaseSettings, {
        options: {
            browserifyOptions: {
                fullPaths: fullPaths
            }
        }
    });

    bconfig.watchAppCommon = merge(bconfig.appCommon, {
        options: {
            watch: true
        }
    });

    /// TESTS
    /**
     * Source of the App bundle
     */
    var TESTS_SOURCE = './source/test/**/*.js';
    /**
     * Destination of the App bundle
     */
    var TESTS_DEST = './build/assets/js/tests.js';
    /**
     * Destintation for the App bundle source-map file.
     */
    var TESTS_DEST_MAP = TESTS_DEST + '.map';

    /**
        Tests bundle
    **/
    bconfig.tests = {
        'src': [
            TESTS_SOURCE
        ],
        'dest': TESTS_DEST,
        'options': {
            'browserifyOptions': {
                'debug': true,
                fullPaths: fullPaths
            },
            plugin: [
                'common-shakeify'
            ],
            preBundleCB: function(b) {
                b.on('bundle', function() {
                    // Exorcist integration
                    b.pipeline.get('wrap').push(exorcist(TESTS_DEST_MAP));
                });
            }
        }
    };

    return bconfig;
};
