'use strict';

module.exports = function(/*grunt*/) {

    var getPublicModulesFrom = require('./shared/getPublicModulesFrom');

    /**
        Browserify config
    **/
	var bconfig = {
        options: {
            transform: [['stringify', {
                appliesTo: { includeExtensions: ['.html'] },
                minify: true,
                minifyAppliesTo: { includeExtensions: ['.html'] },
                minifyOptions: require('./htmlmin.settings')
            }]]
        }
    };

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
                './vendor/iagosrl/ko/domElementBinding:ko/domElementBinding',
                './vendor/iagosrl/layoutUpdateEvent:layoutUpdateEvent',
                './vendor/iagosrl/throttle:iagosrl/throttle',
                'knockout-sortable',
                'geocomplete'
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
                // NOTE: NOT USED RIGHT NOW, IS BUGGY with the app-shell-history
                /*'history': {
                    'path': './vendor/history/jquery.history.js',
                    'exports': 'History'
                },*/
                'fastclick': {
                    path: './vendor/fastclick-forked/fastclick.js',
                    exports: 'FastClick'
                },
                'jquery.ui.touch-punch': {
                    path: './vendor/touch-punch/jquery.ui.touch-punch.min',
                    exports: null,
                    'depends': { 'jquery': null }
                },

                /// JQUERY FILEUPLOAD WITH IMAGE PREVIEW SUPPORT
                // the jquery-ui widget constructor is needed, but this included dependency
                // can be avoided if jquery-ui is included already in the project
                /*'jquery.ui.widget': {
                    path: './vendor/jquery.fileupload/js/vendor/jquery.ui.widget.js',
                    exports: null,
                    depends: { jquery: 'jquery' }
                },*/
                // Basic fileupload through XHR component
                'jquery.fileupload': {
                    path: './vendor/jquery.fileupload/js/jquery.fileupload.js',
                    exports: null,
                    depends: {
                        jquery: 'jquery',
                        // jquery-ui is included in the project, use it rather than add duplicated content, and the specific widget module if possible
                        'jquery-ui/widget': null
                        //'jquery-ui': null
                        //'jquery.ui.widget': 'jquery.ui.widget'
                    }
                },
                // Image Preview support, requires the loadImage lib with its dependecies, a polyfill for canvas.toBlob
                // and the fileupload-process plugin
                'load-image': {
                    path: './vendor/js.loadImage/js/load-image.js',
                    exports: 'loadImage',
                    depends: {
                        'jquery': null
                    }
                },
                'load-image.meta': {
                    path: './vendor/js.loadImage/js/load-image-meta.js',
                    exports: null,
                    depends: {
                        'load-image': null
                    }
                },
                'load-image.ios': {
                    path: './vendor/js.loadImage/js/load-image-ios.js',
                    exports: null,
                    depends: {
                        'load-image': null
                    }
                },
                'jquery.fileupload-process': {
                    path: './vendor/jquery.fileupload/js/jquery.fileupload-process.js',
                    exports: null,
                    depends: {
                        'jquery.fileupload': null
                    }
                },
                'jquery.fileupload-image': {
                    path: './vendor/jquery.fileupload/js/jquery.fileupload-image.js',
                    exports: null,
                    depends: {
                        'jquery.fileupload': null,
                        'jquery.fileupload-process': null,
                        'load-image': null,
                        'load-image.ios': null,
                        'load-image.meta': null,
                        'blueimp-canvas-to-blob': null
                    }
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
            'shim': {
                'bootstrap-carousel': {
                    path: './vendor/bootstrap-source/js/carousel.js',
                    exports: null,
                    depends: { 'jquery': 'jquery' }
                }
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
