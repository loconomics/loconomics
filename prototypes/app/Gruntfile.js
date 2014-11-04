/** Grunt tasks configuration
**/
module.exports = function (grunt) {

    var assetsBannerTpl =
    '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '   Author: Loconomics Inc. */\n';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

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
            proto: {
                files: {
                    'proto.css': ['proto.styl']
                }
            }
        },

        watch: {
            css: {
                files: ['**/*.styl', 'Gruntfile.js'],
                tasks: ['build-css']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask('build-css', ['stylus', 'notify:css']);
    grunt.registerTask('build-dev', ['stylus', 'notify:css', 'notify:build']);
    grunt.registerTask('build', ['build-css', 'notify:build']);

    grunt.registerTask('default', ['build']);

};