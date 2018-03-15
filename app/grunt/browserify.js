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
var merge = require('./shared/mergeGruntBrowserifySettings');
var notify = require('grunt-notify/lib/notify-lib');
var notifySettings = require('./notify.js');
// Using exorcist to extract source-maps from files.
// We use the API directly rather than the 'grunt-exorcise'
// (used in the past, removed when commiting this comment)
// because is the only way to make it works with watch[ify] option.
var exorcist = require('exorcist');
var browserifyBundles = require('./shared/browserifyBundles');
require('common-shakeify');
var browserifyStylus = require('./shared/browserifyStylus');
var envOptions = require('./shared/envOptions');
var queryActivities = require('./shared/queryActivities');

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
     * Whether enable verbose output for some extra modules, plugins or custom code.
     * NOTE: this flag is already supported by Grunt and most plugins to generate
     * additional output, while some others needs to pass in this as setting
     * explicitely (happens with some Browserify plugins, but not others)
     * @private {Boolean}
     */
    var verbose = !!grunt.option('verbose');
    /**
     * Whether current environment is 'development', in order to enable
     * features like source-maps (Browserify debug mode).
     * IMPORTANT: This parameter is shared with other tasks and settings, should
     * keep the same on every use for consistent results (see '--dev').
     * @private {Boolean}
     */
    var dev = envOptions.inDev();
    /**
     Browserify config
     **/
    var bconfig = {};

    // Utility to send a desktop notification
    var sendRebuildNotification = function() {
        notify(notifySettings.browserify.options);
    };

    /// Set-up bundles to generate
    /**
     * List of bundles for appCommon task.
     * It contains every entry point to the app (scripts that manage app load,
     * set-up of Shell and other global settings),
     * plus on-demand bundles, implementing specific features loaded by the
     * entry points through the Shell loader (activities) or others
     * @private {Array<BundleSettings>}
     */
    const appCommonBundles = [
        // App entry point (the main one)
        {
            source: './source/js/app.js',
            dest: './build/assets/js/app.js',
            map: dev && './build/assets/js/app.js.map'
        },
        // Landing Page entry point (AKA 'welcome' pages)
        {
            source: './source/js/landingPage.js',
            dest: './build/assets/js/welcome.js',
            map: dev && './build/assets/js/welcome.js.map'
        }
    ];
    // Query activities paths
    const {
        appCommonActivities,
        activitiesBasePath,
        buildPathForActivity
    } = queryActivities.query(grunt);
    // We convert the array of activities files into BundleSettings,
    // and are appended to the bundles collection
    appCommonBundles.push(...appCommonActivities.map((activityPath) => {
        // We rebuild the original path relative to app directory as source
        // and create the destination using the activity name
        const buildPath = buildPathForActivity(activityPath);
        // Create returned object (in comments, example of values to be created)
        return {
            // source: './source/js/activities/about/index.js',
            source: activitiesBasePath + activityPath,
            // dest: './build/assets/js/activities/about.js',
            dest: buildPath,
            // map: dev && './build/assets/js/activities/about.js.map'
            map: dev && (buildPath + '.map')
        };
    }));

    /**
        Generates the [app, landingPage] bundles,
        extracting the common parts out.
    **/
    var appCommonBaseSettings = browserifyBundles.create(
        grunt, {
            dest: './build/assets/js/common.js',
            map: dev && './build/assets/js/common.js.map'
        }, appCommonBundles,
        sendRebuildNotification
    );
    appCommonBaseSettings = merge(appCommonBaseSettings, browserifyStylus.create(grunt));
    bconfig.appCommon = merge(appCommonBaseSettings, {
        options: {
            browserifyOptions: {
                fullPaths: fullPaths
            },
            cacheFile: dev && './build/.browserify-cache-appCommon.json'
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
            cacheFile: './build/.browserify-cache-tests.json',
            plugin: [
                ['common-shakeify', { verbose: verbose }]
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
