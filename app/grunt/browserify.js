'use strict';

module.exports = function(/*grunt*/) {
    /**
        Browserify config
    **/
	var bconfig = {};

    /**
        App bundle
    **/
    bconfig.app = {
        'src': [
            './source/js/app.js'
        ],
        'dest': './build/assets/js/app.js',
        'options': {
            'browserifyOptions': {
                'debug': true
            }
        }
    };

    /**
     * Landing pages bundle
     */
    bconfig.landingPages = {
        'src': [
            './source/js/landingPage.js'
        ],
        'dest': './build/assets/js/welcome.js',
        'options': {
            'browserifyOptions': {
                'debug': true
            }
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
