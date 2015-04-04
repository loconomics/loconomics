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
                    path: './vendor/jquery/jquery-2.1.3.min.js',
                    exports: 'jQuery'
                },
                'bootstrap': {
                    // Using latest Bootstrap version:
                    path: './vendor/bootstrap/js/bootstrap.min.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                },
                'bootstrap-switch': {
                    path: './vendor/bootstrap-switch/js/bootstrap-switch.min.js',
                    exports: null,
                    depends: { 'jquery': 'jquery', 'bootstrap': 'bootstrap' }
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
                'lodash',
                'es6-promise',
                'localforage',
                // Using a specific browser version of events.EventEmitter, to avoid
                // the extra load of NodeJS/Browserify 'events' module that has heavy-unneed
                // dependencies as 'utils'.
                './node_modules/events:events',
                './vendor/iagosrl/ko/formatBinding:ko/formatBinding',
                './vendor/iagosrl/layoutUpdateEvent:layoutUpdateEvent'
            ],
            'shim': {
                'jquery-ui':  {
                    'path': './vendor/jquery-ui/jquery-ui.js',
                    'exports': null,
                    'depends': { 'jquery': null }
                },
                'jquery-mobile':  {
                    'path': './vendor/jquerymobile/jquery.mobile.custom.js',
                    'exports': null,
                    'depends': { 'jquery': null }
                },
                'history': {
                    'path': './vendor/history/jquery.history.js',
                    'exports': 'History'
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

    return bconfig;
};