/*** Some custom tasks ***/

/**
  Fix well-know images routes for some vendor files to let they still work as
  expected in the destination file (for concatenated files that goes to
  a different folder, like jquery-ui theme).
**/
function fixCssImageRoutes(src, filepath) {
    if (/smoothness\/jquery-ui/i.test(filepath)) {
        return src.replace(/images\//gi, 'smoothness/images/');
    }
    return src;
}

/** Grunt tasks configuration
**/
module.exports = function (grunt) {

    var assetsBannerTpl =
    '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '   Author: Loconomics Inc. */\n';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                'banner': assetsBannerTpl
            },
            'js-common': {
                options: { separator: ';' },
                src: ['./Scripts/libs.min.js', './Scripts/app.min.js'],
                dest: './Scripts/common.min.js'
            },
            'css-common': {
                src: [
                  './Styles/app/app.css',
                  './Styles/app-includes.css',
                  './Styles/app/w-ProviderPackage.css',
                  './Styles/smoothness/jquery-ui-1.8.21.custom.css',
                  './Scripts/jcrop/css/jquery.Jcrop.min.css'
                ],
                dest: './Styles/common.css',
                options: {
                    process: fixCssImageRoutes
                }
            }
        },

        notify: {
            build: {
                options: {
                    title: 'Build complete',  // optional
                    message: 'Build finished successfully.' //required
                }
            },
            browserify: {
                options: {
                    title: 'Browserify build complete',  // optional
                    message: 'Browserify build finished successfully.' //required
                }
            },
            css: {
                options: {
                    title: 'CSS build complete',  // optional
                    message: 'CSS build finished successfully.' //required
                }
            }
        },

        browserify: {
            'libs': {
                'src': [],
                'dest': './Scripts/libs.js',
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
                            path: './Scripts/jquery/jquery-1.7.2.min.js',
                            exports: 'jQuery'
                        },
                        'jquery-ui': {
                            path: './Scripts/jquery/jquery-ui-1.8.21.custom.min.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        },
                        'jquery.blockUI': {
                            path: './Scripts/jquery/jQuery.blockUI.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        },
                        'jquery.ba-hashchange': {
                            path: './Scripts/jquery/jquery.ba-hashchange.min.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        },
                        'jquery.formatter': {
                            path: './Scripts/jquery/jquery.formatter.min.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        },
                        'bootstrap': {
                            path: './Scripts/libs/bootstrap/js/bootstrap.min.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        },
                        modernizr: {
                            path: './Scripts/libs/modernizr.custom.2.6.2.js',
                            exports: 'Modernizr',
                            depends: { 'jquery': 'jquery' }
                        },
                        fileuploader: {
                            path: './Scripts/fileuploader/fileuploader.js',
                            exports: 'qq',
                            depends: { 'jquery': 'jquery' }
                        },
                        jcrop: {
                            path: './Scripts/jcrop/js/jquery.Jcrop.min.js',
                            exports: null,
                            depends: { 'jquery': 'jquery' }
                        }
                    }
                }
            },
            'app': {
                'src': [
                  './Scripts/app/app.js',
                  './Scripts/LC/FacebookConnect.js',
                  './Scripts/LC/dateISO8601.js',
                  './Scripts/LC/SimpleSlider.js'
                ],
                'dest': './Scripts/app.js',
                'options': {
                    // Enable debug evern when compiling script.js, the min.js will delete debug info for production use:
                    'debug': true,
                    // Modules loaded from other bundle (libs.js)
                    'external': [
                        'jquery',
                        'jquery-ui',
                        'modernizr',
                        'jquery.blockUI',
                        'jquery.ba-hashchange',
                        'jquery.formatter',
                        'bootstrap',
                        'fileuploader',
                        'jcrop'
                    ],
                    alias: [
                        './Scripts/LC/StringFormat:StringFormat',
                        './Scripts/LC/FacebookConnect.js:LC/FacebookConnect',
                        './Scripts/LC/getText.js:LC/getText',
                        './Scripts/LC/validationHelper.js:LC/validationHelper',
                        './Scripts/LC/jqueryUtils.js:LC/jqueryUtils',
                        './Scripts/LC/TimeSpan.js:LC/TimeSpan',
                        './Scripts/LC/TimeSpanExtra.js:LC/TimeSpanExtra',
                        './Scripts/LC/tooltips.js:LC/tooltips',
                        './Scripts/LC/googleMapReady.js:LC/googleMapReady',
                        './Scripts/LC/smoothBoxBlock.js:LC/smoothBoxBlock',
                        './Scripts/LC/moveFocusTo.js:LC/moveFocusTo',
                        './Scripts/LC/changesNotification.js:LC/changesNotification',
                        './Scripts/LC/dateISO8601.js:LC/dateISO8601',
                        './Scripts/LC/availabilityCalendar/index.js:LC/availabilityCalendar',
                        './Scripts/LC/SimpleSlider.js:LC/SimpleSlider',
                        './Scripts/LC/ajaxForms.js:LC/ajaxForms',
                        './Scripts/LC/ajaxCallbacks.js:LC/ajaxCallbacks',
                        './Scripts/LC/batchEventHandler:LC/batchEventHandler'
                    ]
                }
            },
            'dashboard': {
                'src': './Scripts/app/dashboard.js',
                'dest': './Scripts/dashboard.js',
                'options': {
                    'debug': true,
                    'external': [
                        '<%= browserify.app.options.external %>',
                        'LC/FacebookConnect',
                        'LC/getText',
                        'LC/validationHelper',
                        'LC/jqueryUtils',
                        'LC/TimeSpan',
                        'LC/TimeSpanExtra',
                        'LC/tooltips',
                        'LC/googleMapReady',
                        'LC/smoothBoxBlock',
                        'LC/moveFocusTo',
                        'LC/changesNotification',
                        'LC/dateISO8601',
                        'LC/availabilityCalendar',
                        'LC/ajaxForms',
                        'LC/ajaxCallbacks',
                        'LC/batchEventHandler'
                    ]
                }
            },
            'styleguide': {
                'src': [
                  './Scripts/app/styleguide.js'
                ],
                'dest': './Scripts/styleguide.js',
                'options': {
                    // Enable debug evern when compiling script.js, the min.js will delete debug info for production use:
                    'debug': true,
                    // Modules loaded from other bundle (libs.js)
                    'external': [
                        'jquery',
                        'bootstrap'
                    ]
                }
            }
        },

        uglify: {
            'libs': {
                'files': {
                    'Scripts/libs.min.js': ['<%= browserify.libs.dest %>']
                }
            },
            'app': {
                'files': {
                    'Scripts/app.min.js': ['<%= browserify.app.dest %>']
                }
            },
            'dashboard': {
                'files': {
                    'Scripts/dashboard.min.js': ['<%= browserify.dashboard.dest %>']
                }
            }
        },

        qunit: {
            all: ['Scripts/tests/**/*.html']
        },

        jshint: {
            all: {
                files: { src: ['Gruntfile.js', 'Scripts/app/**/*.js', 'Scripts/LC/**/*.js', 'Scripts/tests/**/*.js'] },
                options: {
                    ignores: ['Scripts/tests/libs/*.js'],
                    // options here to override JSHint defaults
                    browser: true,
                    laxcomma: true,
                    globals: {
                        jQuery: true,
                        console: true,
                        module: true,
                        document: true
                    },
                    '-W107': false
                }
            }
        },

        stylus: {
            options: {
                // Se usa cssmin para compresión, éste sin comprimir y con información de depuración
                compress: false,
                linenos: true,
                //paths: ['path/to/import', 'another/to/import'],
                // use embedurl('test.png') in our code to trigger Data URI embedding
                urlfunc: 'embedurl',
                'include css': true,
                banner: assetsBannerTpl
                /*
                import: [      //  @import 'foo', 'bar/moo', etc. into every .styl file
                'foo',       //  that is compiled. These might be findable based on values you gave
                'bar/moo'    //  to `paths`, or a plugin you added under `use`
                ]*/
            },
            dashboard: {
                files: {
                    //'Styles/app.css': ['Styles/app/app.styl']
                    'Styles/dashboard.css': ['Styles/app/dashboard.styl']
                }
            },
            'app-includes': {
                files: {
                    'Styles/app-includes.css': ['Styles/app/app-includes.styl']
                }
            },
            'provider-welcome': {
                files: {
                    'Styles/provider-welcome.css': ['Styles/app/provider-welcome.styl']
                }
            },
            'styleguide': {
                files: {
                    'Styles/styleguide.css': ['Styles/app/styleguide.styl']
                }
            }
        },

        cssmin: {
            options: {
                // Eliminamos todos los comentarios incluso el banner original
                keepSpecialComments: 0,
                // Se añade el banner de nuevo, que incluye un salto de línea antes del código
                banner: assetsBannerTpl,
                /* NOTE: Disabled the advanced mode because causes next know problems with our code:
                - html:before{ background gradient }  it gets removed some rules, letting background white
                */
                noAdvanced: true
            },
            css: {
                files: {
                    'Styles/dashboard.min.css': ['Styles/dashboard.css'],
                    'Styles/provider-welcome.min.css': ['Styles/provider-welcome.css']
                }
            },
            'plain-css': {
                files: {
                    'Styles/common.min.css': ['Styles/common.css']
                }
            }
        },

        clean: {
            'css-app-includes': ['Styles/app-includes.css']
        },

        watch: {
            js: {
                files: ['<%= jshint.all.files.src %>'],
                tasks: ['build-js', 'test']
            },
            css: {
                files: ['Styles/**/*.styl', 'Gruntfile.js'],
                tasks: ['build-css']
            },
            'plain-css': {
                files: ['Styles/app/*.css', 'Gruntfile.js'],
                tasks: ['stylus:app-includes', 'concat:css-common', 'notify:css', 'cssmin:plain-css', 'clean:css-app-includes']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('build-js', ['browserify', 'notify:browserify', 'uglify', 'concat:js-common']);
    grunt.registerTask('build-css', ['stylus', 'concat:css-common', 'notify:css', 'cssmin', 'clean:css-app-includes']);
    grunt.registerTask('build-dev', ['browserify', 'notify:browserify', 'stylus', 'concat:css-common', 'notify:css', 'clean:css-app-includes', 'notify:build']);
    grunt.registerTask('build', ['build-js', 'build-css', 'notify:build']);

    grunt.registerTask('default', ['build', 'test']);

};