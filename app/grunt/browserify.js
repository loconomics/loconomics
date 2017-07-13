'use strict';

module.exports = function(/*grunt*/) {
    /**
        Browserify config
    **/
    var bconfig = {};

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
            // Listen to 'end' event (not to 'finish') that guarantees
            // that was processed, written to disk and file closed.
            factor.on('end', resolve);
            factor.on('error', error);
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
        b.removeListener('factor.pipeline', factorToPromise);
        b.on('factor.pipeline', factorToPromise);
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
            next(err, src);
        })
        .catch(function(factorsErr) {
            console.error('Browserify: failed bundle factorization');
            next(factorsErr, src);
        });
    };

    /**
        Generates the [app, landingPage] bundles,
        extracting the common parts out.
    **/
    bconfig.appCommon = {
        files: {
            './build/assets/js/common.js': [
                './source/js/app.js',
                './source/js/landingPage.js'
            ]
        },
        options: {
            browserifyOptions: {
                debug: true
            },
            plugin: [
                [
                    'factor-bundle', {
                        // Output take strictkly the same order than listed
                        // source files, so they match the expected name-content
                        o: [
                            './build/assets/js/app.js',
                            // landingPage renamed as 'welcome' in the result
                            './build/assets/js/welcome.js'
                        ]
                    }
                ]
            ],
            preBundleCB: preBundle,
            postBundleCB: postBundle
        }
    };

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
