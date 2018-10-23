/**
 * Utility to set-up Browserify for splitting a file in several bundles
 * and extract source maps. Made for integration with Grunt-browserify.
 * It uses exorcist and factor-bundle (this last does not need to be 'required'
 * because is included as part of the settings for the plugin that is how
 * Browserify loads that, but to ensure an error in case module is not
 * in dependencies, we require it).
 * It uses common-shakeify too, not required to create bundles but it does:
 * remove 'dead code' because of unused modules
 * features (also called 'tree shaking'). We do it here ensuring is the first
 * plugin in the list so it works on the original, 'full', bundle (before splittting
 * happens)
 */
'use strict';
// Using exorcist to extract source-maps from files.
// We use the API directly rather than the 'grunt-exorcise'
// because is the only way to make it works with watch[ify] option.
var exorcist = require('exorcist');
require('factor-bundle');
require('common-shakeify');

/**
 * @typedef {Object} BundleSettings
 * @property {string} [source] Path to source file (entry point). Doesn't exists
 * when defining a 'commons' bundle.
 * @property {string} dest Path to destination file (output of the bundle)
 * @property {string} [map] Path to the destination for the source map file (usually
 * together the dest plus a '.map' extension)
 */

/**
 *
 * @param {Grunt} grunt
 * @param {BundleSettings} commonBundle Definition of the 'commons' file; if
 * a source map path is given, the resulting task will enable the Browserify
 * option 'debug' (to generate that source map files) and will be required
 * for each bundles defined.
 * @param {Array<BundleSettings>} bundles Definitions of the wanted bundles,
 * except the 'commons bundle' that is defined at commonBundle; this means this
 * should contain each entry file in your app that will share the 'commons'.
 * @param {Function} [onCompleted] Callback executed everytime the process ends
 * creating all the bundles and map files.
 * @returns {GruntTaskSettings} Object with the format of a Grunt task settings,
 * plus options specific for Grunt-browserify
 */
exports.create = function(grunt, commonBundle, bundles, onCompleted) {
    /**
     * Whether enable verbose output for some extra modules, plugins or custom code.
     * NOTE: this flag is already supported by Grunt and most plugins to generate
     * additional output, while some others needs to pass in this as setting
     * explicitely (happens with some Browserify plugins, but not others)
     * @private {Boolean}
     */
    var verbose = !!grunt.option('verbose');
    /**
     * A list of factors promises that fulfills when files were written.
     * Each factor is a bundle splitted from the original one
     * (out of 'common.js')
     */
    var factorsPromises = [];
    /**
     * Detect if map files are wanted (by being specified at the commons bundle)
     */
    var usesMapFiles = !!commonBundle.map;
    /**
     * Given a path to the bundle source file (as given by factor-bundle),
     * returns the bundle settings for it, or null
     * @param {string} sourcePath
     * @returns {BundleSettings}
     */
    var getBundleSettingForFile = function(sourcePath) {
        // Use UNIX path separator even on Windows to simplify comparisions and
        // ensure cross-platform compatibility.
        var normalizedPath = sourcePath.replace(/\\/g, '/');
        var settings = null;
        bundles.some(function(bundle) {
            // TODO: To document why need to strip first two characters (usually
            // they are './' so maybe sourcePath uses a relative path, without that)
            // and if changes if doesn't play well with other set-ups
            if (normalizedPath.indexOf(bundle.source.substr(2)) > 0) {
                settings = bundle;
                return true;
            }
        });
        return settings;
    };
    /**
     * Create a Promise that fulfills when the factorized file was wrote
     * to disk.
     * @param {string} path Full file path
     * @param {Stream} factor Factor pipeline, a 'labeled-stream-splicer'
     * class that implements a Stream with 'end' event.
     * @returns {Promise}
     */
    var factorToPromise = function (path, factor) {
        factorsPromises.push(new Promise(function (resolve, error) {
            var bundleSettings = getBundleSettingForFile(path);
            grunt.verbose.writeln('New Promise for factor', bundleSettings.dest);
            if (usesMapFiles) {
                // Exorcist integration
                if (!bundleSettings.map) {
                    grunt.fail.warn('At browserify: unknow factorized path: ' + path);
                }
                factor.get('wrap').push(exorcist(bundleSettings.map));
            }
            // Listen to 'end' event (not to 'finish') that guarantees
            // that was processed, written to disk and file closed.
            // (NOTE: per WritableStream docs, seems that 'finish' fulfills that requirements, but doesn't --tested)
            factor.on('end', function() {
                // IMPORTANT: There are still cases where the file seems to not have ended writting/flushing when
                // reaching this point for very few bytes, we put a small timeout to try give
                // it some more time (that includes another js cycle).
                // TODO: Try a branch that seems to fix this buggy behavior, at https://github.com/browserify/factor-bundle/commit/686b806aa521f092f9d8d27ea2b8266b4080eb0d
                setTimeout(function() {
                    grunt.verbose.writeln('>> Bundle', bundleSettings.dest, 'created (factor-bundle).');
                    resolve();
                }, 100);
            });
            factor.on('error', error);
        }));
    };
    /**
     * Handle and notify errors found generating the output
     * @param {Error} err
     */
    var handleOutputError = function (err) {
        grunt.verbose.error().error(err);
        grunt.fail.warn('Browserify bundle error: ' + err.toString());
    };
    /**
     * Callback for grunt-browserify pre-setup.
     * Will register promises for all the factorization process
     * @param {Browserify} b
     */
    var configure = function (b) {
        // Listen each factor added
        b.removeListener('factor.pipeline', factorToPromise);
        b.on('factor.pipeline', factorToPromise);
        // Listen errors when initially creating the main/full bundle
        // (syntax errors, not found modules; all before content is splitted).
        b.on('bundle', function (output) {
            output.removeListener('error', handleOutputError);
            output.on('error', handleOutputError);
            if (usesMapFiles) {
                // Exorcist integration
                b.pipeline.get('wrap').push(exorcist(commonBundle.map));
            }
        });
        b.on('error', function (err) {
            // Something went wrong.
            grunt.verbose.error().error(err);
            grunt.fail.warn('Something went wrong: ' + err.toString());
        });
    };
    /**
     * Callback for grunt-browserify pre-processing.
     * Reset current 'factors' being processed.
     * @param {Browserify} b
     */
    var preBundle = function () {
        factorsPromises = [];
    };
    /**
     * Callback for grunt-browserify post-processing.
     * Will ensure that all factorization processes have completed
     * before let the process to continue.
     * IMPORTANT: This is very important because by default, the Grunt task will
     * continue and close the running process without wait for completion,
     * resulting in corrupted/incompleted files being written.
     * @param {Error} err An error
     * @param {(String|Buffer)} src Source of the generated bundle
     * @param {Function} next Call when done to let the process to continue
     */
    var postBundle = function (err, src, next) {
        Promise
        .all(factorsPromises)
        .then(function () {
            grunt.log.ok('Browserify factor-bundle completed with', factorsPromises.length, 'bundles');
            next(err, src);
            // Notify just after actually complete creating the bundle
            if (onCompleted) onCompleted();
        })
        .catch(function (factorsErr) {
            grunt.verbose.error().error(factorsErr);
            grunt.fail.warn('Browserify factor-bundle failed:' + factorsErr.toString());
            next(factorsErr, src);
        });
    };

    /**
     * Returns the set-up for the Grunt-browserify task, that can be assigned
     * directly to the task-target or extended with additional options;
     * because of that, it follows the structure of {files, options} for
     * a Grunt multi-task and the options allowed by Grunt-browserify.
     */
    return {
        files: {
            [commonBundle.dest]: bundles.map((bundle) => bundle.source)
        },
        options: {
            browserifyOptions: {
                debug: usesMapFiles
            },
            configure: configure,
            preBundleCB: preBundle,
            postBundleCB: postBundle,
            // Array of plugins, we have just one that is defined as an array
            // of name plus settings
            plugin: [
                ['common-shakeify', { verbose: verbose }],
                [
                    // Output take strictkly the same order than listed
                    // source files, so they match the expected name-content
                    'factor-bundle', {
                        output: bundles.map((bundle) => bundle.dest),
                        // TODO: Done some research and tests (with helper grunt/shared/readFilesSizes)
                        // and found that a value of 5 is better than 10 as threshold,
                        // in order to get a smaller main bundle size
                        // while not increasing too much the activities (because of duplication)
                        // BUT it webapp starts failing when entering /dashboard (should happen
                        // on more places), needs more research since is really interesting
                        // to be able to fine-tune size/performance with this, but letting
                        // this documented and the default value of 1 explicit for now:
                        threshold: 1
                    }
                ]
            ]
        }
    };
};
