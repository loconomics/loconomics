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
     * returns the map file for it, or empty
     * @param {string} sourcePath
     * @returns {string}
     */
    var getMapFileFor = function(sourcePath) {
        // Use UNIX path separator even on Windows to simplify comparisions and
        // ensure cross-platform compatibility.
        var normalizedPath = sourcePath.replace(/\\/g, '/');
        var mapFile = '';
        bundles.some(function(bundle) {
            // TODO: To document why need to strip first two characters (usually
            // they are './' so maybe sourcePath uses a relative path, without that)
            // and if changes if doesn't play well with other set-ups
            if (normalizedPath.indexOf(bundle.source.substr(2)) > 0) {
                mapFile = bundle.map;
                return true;
            }
        });
        return mapFile;
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
            grunt.verbose.writeln('New Promise for factor', path);
            // Listen to 'end' event (not to 'finish') that guarantees
            // that was processed, written to disk and file closed.
            factor.on('end', resolve);
            factor.on('error', error);
            if (usesMapFiles) {
                // Exorcist integration
                var mapFile = getMapFileFor(path);
                if (!mapFile) {
                    grunt.fail.warn('At browserify: unknow factorized path: ' + path);
                }
                factor.get('wrap').push(exorcist(mapFile));
            }
        }));
    };
    /**
     * Callback for grunt-browserify pre-processing.
     * Will register promises for all the factorization process
     * @param {Browserify} b
     */
    var preBundle = function (b) {
        // Reset current 'factors' being processed.
        factorsPromises = [];
        // Listen each factor added
        b.removeListener('factor.pipeline', factorToPromise);
        b.on('factor.pipeline', factorToPromise);
        // Listen errors when initially creating the main/full bundle
        // (syntax errors, not found modules; all before content is splitted).
        b.on('bundle', function (output) {
            output.on('error', function (err) {
                grunt.verbose.error().error(err);
                grunt.fail.warn('Browserify bundle error: ' + err.toString());
            });
            // Exorcist integration
            b.pipeline.get('wrap').push(exorcist(commonBundle.map));
        });
        b.on('error', function (err) {
            // Something went wrong.
            grunt.verbose.error().error(err);
            grunt.fail.warn('Something went wrong: ' + err.toString());
        });
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
        Promise.all(factorsPromises).then(function () {
            grunt.log.ok('Browserify factor-bundle completed with', factorsPromises.length, 'bundles');
            if(onCompleted) onCompleted();
            next(err, src);
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
            preBundleCB: preBundle,
            postBundleCB: postBundle,
            // Array of plugins, we have just one that is defined as an array
            // of name plus settings
            plugin: [
                'common-shakeify',
                [
                    // Output take strictkly the same order than listed
                    // source files, so they match the expected name-content
                    'factor-bundle', {
                        output: bundles.map((bundle) => bundle.dest)
                    }
                ]
            ]
        }
    };
};
