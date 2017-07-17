'use strict';
var merge = require('deepmerge');
var notify = require('grunt-notify/lib/notify-lib');
var notifySettings = require('./notify.js');
var exorcist = require('exorcist');

module.exports = function(grunt) {
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
     * A list of factors promises that fulfills when files were written.
     * Each factor is a bundle splitted from the original one
     * (out of 'common.js')
     */
    var factorsPromises = [];
    /**
     * Create a Promise that fulfills when the factorized file was wrote
     * to disk.
     * @param {string} path Full file path
     * @param {Stream} factor Factor pipeline, a 'labeled-stream-splicer'
     * class that implements a Stream with 'end' event.
     * @returns {Promise}
     */
    var factorToPromise = function(path, factor) {
        factorsPromises.push(new Promise(function(resolve, error) {
            grunt.verbose.writeln('New Promise for factor', path);
            // Listen to 'end' event (not to 'finish') that guarantees
            // that was processed, written to disk and file closed.
            factor.on('end', resolve);
            factor.on('error', error);

            // Exorcise integration
            var mapFile = '';
            var normalizedPath = path.replace(/\\/g, '/');
            if (normalizedPath.indexOf(APP_SOURCE.substr(2)) > 0) {
                mapFile = APP_DEST_MAP;
            }
            else if (normalizedPath.indexOf(LANDING_PAGE_SOURCE.substr(2)) > 0) {
                mapFile = LANDING_PAGE_DEST_MAP;
            }
            else {
                grunt.fail.warn('At browserify: unknow factorized path: ' + path);
            }
            factor.get('wrap').push(exorcist(mapFile));
        }));
    };
    /**
     * Callback for grunt-browserify pre-processing.
     * Will register promises for all the factorization process
     * @param {Browserify} b
     */
    var preBundle = function(b) {
        // Reset current 'factors' being processed.
        factorsPromises = [];
        // Listen each factor added
        b.removeListener('factor.pipeline', factorToPromise);
        b.on('factor.pipeline', factorToPromise);
        // Listen errors when initially creating the main/full bundle
        // (syntax errors, not found modules; all before content is splitted).
        b.on('bundle', function(output) {
            output.on('error', function(err) {
                grunt.verbose.error().error(err);
                grunt.fail.warn('Browserify bundle error: ' + err.toString());
            });

            // Exorcise integration
            b.pipeline.get('wrap').push(exorcist(COMMON_DEST_MAP));
        });
        b.on('error', function(err) {
            // Something went wrong.
            grunt.verbose.error().error(err);
            grunt.fail.warn('Something went wrong: ' + err.toString());
        });
    };
    /**
     * Callback for grunt-browserify post-processing.
     * Will ensure that all factorization processes have completed
     * before let the process to continue.
     * IMPORTANT: This is very important becaus by default, the Grunt task will
     * continue and close the running process without wait for completion,
     * resulting in corrupted/incompleted files being written.
     * @param {Error} err An error
     * @param {(String|Buffer)} src Source of the generated bundle
     * @param {Function} next Call when done to let the process to continue
     */
    var postBundle = function(err, src, next) {
        Promise.all(factorsPromises).then(function() {
            grunt.log.ok('Browserify factor-bundle completed with', factorsPromises.length, 'bundles');
            sendRebuildNotification();
            next(err, src);
        })
        .catch(function(factorsErr) {
            grunt.verbose.error().error(factorsErr);
            grunt.fail.warn('Browserify factor-bundle failed:' + factorsErr.toString());
            next(factorsErr, src);
        });
    };


    /**
        Generates the [app, landingPage] bundles,
        extracting the common parts out.
    **/
    bconfig.appCommon = {
        files: {
            [COMMON_DEST]: [
                APP_SOURCE,
                LANDING_PAGE_SOURCE
            ]
        },
        options: {
            browserifyOptions: {
                debug: true
            },
            plugin: [
                [
                    // Output take strictkly the same order than listed
                    // source files, so they match the expected name-content
                    'factor-bundle', {
                        output: [
                            APP_DEST,
                            LANDING_PAGE_DEST
                        ]
                    }
                ]
            ],
            preBundleCB: preBundle,
            postBundleCB: postBundle
        }
    };

    bconfig.watchAppCommon = merge(bconfig.appCommon, {
        options: {
            watch: true
        }
    });

    /**
        Tests bundle
    **/
    bconfig.tests = {
        'src': [
            './source/test/**/*.js'
        ],
        'dest': './build/assets/js/tests.js',
        'options': {
            'browserifyOptions': {
                'debug': true
            }
        }
    };

    return bconfig;
};
