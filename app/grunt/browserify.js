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
            dest: './build/assets/js/common.js',
            map: dev && './build/assets/js/common.js.map'
        }, [{
            source: './source/js/app.js',
            dest: './build/assets/js/app.js',
            map: dev && './build/assets/js/app.js.map'
        }, {
            source: './source/js/landingPage.js',
            dest: './build/assets/js/welcome.js',
            map: dev && './build/assets/js/welcome.js.map'
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

    var postcss = require('postcss');
    var poststylus = require('poststylus');
    var autoprefixer = require('autoprefixer');
    var stylify = require('stylify');
    var CleanCSS = require('clean-css');
    var cleanCssSettings = require('./cssmin.settings.js');
    var postCleanCss = postcss.plugin('clean-css', function() {
        const cleancss = new CleanCSS(cleanCssSettings);
        return function (css, res) {
            var result = cleancss.minify(css.toString());
            if (result.warnings) {
                for(const msg of result.warnings) {
                    // Logs without stop task
                    grunt.log.error('CleanCSS:', msg);
                    //res.warn(msg);
                }
            }
            if (result.errors) {
                for(const msg of result.errors) {
                    // Logs stopping task, except --force is used
                    grunt.fail.warn('CleanCSS:', msg);
                    //res.error(msg); ?
                }
            }
            // NOTE: Something to do with result.sourceMap? and .stats?
            // (Stylus has not source maps, that is the really important, so
            // a map for minified is not relevant)
            // Return optimized styles:
            res.root = postcss.parse(result.styles);
        };
    });
    const sharedStylusSettings = require('./stylus.settings');

    var stylifyOptions = {
        use: [
            require('nib')(),
            poststylus([
                autoprefixer,
                postCleanCss()
            ])
        ],
        "set": sharedStylusSettings
    };

    bconfig.trialcss = {
        'src': [
            './source/trialcss/trialcss.js'
        ],
        'dest': './build/trialcss/trialcss.js',
        'options': {
            'browserifyOptions': {
                'debug': true,
                fullPaths: fullPaths
            },
            plugin: [
                'common-shakeify'
            ],
            configure: function(b) {
                b.transform(stylify, stylifyOptions);
            }
        }
    };

    return bconfig;
};
