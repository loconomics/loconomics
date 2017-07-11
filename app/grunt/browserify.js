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
            // Enable debug evern when compiling script.js, the min.js will delete debug info for production use:
            'debug': false
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
            // Enable debug eve when compiling script.js, the min.js will delete debug info for production use:
            'debug': false
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
            'debug': false
        }
    };

    return bconfig;
};
