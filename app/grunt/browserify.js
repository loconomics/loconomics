'use strict';

module.exports = function(/*grunt*/) {

    var getPublicModulesFrom = require('./shared/getPublicModulesFrom');

    /**
        Browserify config
    **/
    var bconfig = {};

    /**
        Styleguide Libs
    **/
    bconfig.styleguidelibs = {
        'src': [],
        'dest': './build/assets/js/styleguidelibs.js',
        'options': {
            'require': [
                'jquery',
                'bootstrap',
                'bootstrap-switch',
                'jquery.ajaxQueue'
            ]
        }
    };

    var styleguidelibsModules = getPublicModulesFrom(bconfig.styleguidelibs);

    /**
        Libs bundle
    **/
    bconfig.libs = {
        'src': [],
        'dest': './build/assets/js/libs.js',
        'options': {
            'debug': false,
            'external': styleguidelibsModules,
            'require': [
                'moment',
                'numeral',
                'knockout',
                'knockout.mapping',
                //'lodash', // specific modules fetched on demand to minimize the size
                'es6-promise',
                'localforage',
                'is_js',
                'moment-timezone',
                './source/js/custom-modernizr.js:custom-modernizr',
                // Using a specific browser version of events.EventEmitter, to avoid
                // the extra load of NodeJS/Browserify 'events' module that has heavy-unneed
                // dependencies as 'utils'.
                './node_modules/events:events',
                './vendor/iagosrl/ko/formatBinding:ko/formatBinding',
                './vendor/iagosrl/ko/domElementBinding:ko/domElementBinding',
                './vendor/iagosrl/layoutUpdateEvent:layoutUpdateEvent',
                './vendor/iagosrl/throttle:iagosrl/throttle',
                'knockout-sortable',
                'geocomplete',
                'jquery-mobile',
                'fastclick',
                'jquery.ui.touch-punch',
                'jquery.fileupload',
                'load-image',
                'load-image.meta',
                'load-image.ios',
                'jquery.fileupload-process',
                'jquery.fileupload-image'
            ]
        }
    };

    var libsModules = getPublicModulesFrom(bconfig.libs);

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
            'debug': true,
            // Modules from other bundles
            'external': Array.prototype.concat(
                styleguidelibsModules,
                libsModules
            )
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
            'debug': true,
            // Modules from other bundles
            'external': Array.prototype.concat(
                styleguidelibsModules,
                libsModules
            ),
            'require': ['boostrap-carousel']
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
            'debug': true,
            // Modules from other bundles
            'external': Array.prototype.concat(
                styleguidelibsModules,
                libsModules
            )
        }
    };

    return bconfig;
};
