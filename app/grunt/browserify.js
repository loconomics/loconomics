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
            // Despite that plugins and some other modules doesn't return itselfs,
            // we still need the alias to be localizable by the 'require' calls
            // in other bundles (must replicate alias in its 'external' option)
            // Shim generates already alias for each key.
            shim: {
                // Using a shim we avoid jquery to detect the CommonJS loader and 
                // it attachs itself to the global namespace (window) what let
                // the plugins works fine.
                jquery: {
                    path: './vendor/jquery/jquery-2.1.4.js',
                    exports: 'jQuery'
                },
                'bootstrap': {
                    // Using latest Bootstrap version:
                    path: './vendor/bootstrap/js/bootstrap.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                },
                'bootstrap-switch': {
                    path: './vendor/bootstrap-switch/js/bootstrap-switch.js',
                    exports: null,
                    depends: { 'jquery': 'jquery', 'bootstrap': 'bootstrap' }
                },
                'jquery.ajaxQueue': {
                    path: './vendor/caoglish/jquery.ajaxQueue.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                }
            }
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
            'alias': [
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
                './vendor/iagosrl/layoutUpdateEvent:layoutUpdateEvent',
                './vendor/iagosrl/throttle:iagosrl/throttle',
                'knockout-sortable',
            ],
            'shim': {
                /*'jquery-ui':  {
                    'path': './vendor/jquery-ui/jquery-ui.js',
                    'exports': null,
                    'depends': { 'jquery': null }
                },*/
                'jquery-mobile':  {
                    'path': './vendor/jquerymobile/jquery.mobile.custom.js',
                    'exports': null,
                    'depends': { 'jquery': null }
                },
                'history': {
                    'path': './vendor/history/jquery.history.js',
                    'exports': 'History'
                },
                'fastclick': {
                    path: './vendor/fastclick-forked/fastclick.js',
                    exports: 'FastClick'
                },
                'jquery.ui.touch-punch': {
                    path: './vendor/touch-punch/jquery.ui.touch-punch.min',
                    exports: null,
                    'depends': { 'jquery': null }
                }
            }
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
        Splash bundle
    **/
    bconfig.splash = {
        'src': [
            './source/js/splash.js'
        ],
        'dest': './build/assets/js/splash.js',
        'options': {
            debug: true,
            shim: {
                // Using a shim we avoid jquery to detect the CommonJS loader and 
                // it attachs itself to the global namespace (window) what let
                // the plugins works fine.
                jquery: {
                    path: './vendor/jquery/jquery-2.1.4.js',
                    exports: 'jQuery'
                },
                'bootstrap': {
                    // Using latest Bootstrap version:
                    path: './vendor/bootstrap/js/bootstrap.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                },
                'fastclick': {
                    path: './vendor/fastclick-forked/fastclick.js',
                    exports: 'FastClick'
                },
                'jquery.ajaxQueue': {
                    path: './vendor/caoglish/jquery.ajaxQueue.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                }
            },
            'alias': [
                'knockout',
                'es6-promise'
            ]
        }
    };

    return bconfig;
};