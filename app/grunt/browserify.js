'use strict';

module.exports = function(/*grunt*/) {
    /**
        Browserify config
    **/
	var bconfig = {};

    /**
        Common bundles, with common, app, landingPage
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
            ]
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
