module.exports = function(grunt) {

  var assetsBannerTpl =
    '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '   Author: Loconomics Inc. */\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
//    concat: {
//      options: {
//        separator: ';'
//      },
//      dist: {
//        src: ['src/**/*.js'],
//        dest: 'dist/<%= pkg.name %>.js'
//      }
//    },

    browserify: {
      'libs': {
        'src': [
          './Scripts/jquery/jquery-1.7.2.min.js',
          './Scripts/jquery/jquery-ui-1.8.21.custom.min.js',
          // We don't need ES locale support right now:
          //'./Scripts/jquery/jquery.ui.datepicker-es.js',
          './Scripts/libs/modernizr.custom.2.6.2.js',
          './Scripts/jquery/jQuery.blockUI.js',
          './Scripts/jquery/jquery.ba-hashchange.min.js',
          // TODO Investigate for what was used:
          //'./Scripts/jquery/jquery.formatter.min.js'
         ],
        'dest': './Scripts/libs.js',
        'options': {
          // Despite that plugins and some other modules doesn't return itselfs,
          // we still need the alias to be localizable by the 'require' calls
          // in other bundles (must replicate alias in its 'external' option)
          // Shim generates already alias for each key.
          'alias': [
            './Scripts/jquery/jquery-ui-1.8.21.custom.min.js:jquery-ui',
            './Scripts/jquery/jQuery.blockUI.js:jquery.blockUI',
            './Scripts/jquery/jquery.ba-hashchange.min.js:jquery.ba-hashchange',
            //'./Scripts/jquery/jquery.formatter.min.js:jquery.formatter'
          ],
          'noParse': [
            './Scripts/jquery/*.js',
            './Scripts/libs/*.js'
          ],
          shim: {
            // Using a shim we avoid jquery to detect the CommonJS loader and 
            // it attachs itself to the global namespace (window) what let
            // the plugins works fine.
            jquery: {
              path: './Scripts/jquery/jquery-1.7.2.min.js',
              exports: 'jQuery'
            },
            modernizr: {
              path: './Scripts/libs/modernizr.custom.2.6.2.js',
              exports: 'Modernizr'
            }
          }
        }
      },
      'app': {
        'src': './Scripts/app/app.js',
        'dest': './Scripts/script.js',
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
            'jquery.formatter'
          ],
          alias: [
            './Scripts/LC/StringFormat:StringFormat'
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
        'options': {
          'banner': assetsBannerTpl
        },
        'files': {
          //'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
          'Scripts/script.min.js': ['<%= browserify.app.dest %>']
        }
      }
    },
    
    qunit: {
      all: ['Scripts/tests/**/*.html']
    },

    jshint: {
      all: {
        files: { src: ['Gruntfile.js', 'Scripts/app/*.js', 'Scripts/LC/*.js', 'Scripts/tests/**/*.js'] },
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
      all: {
        options: {
          // Se usa cssmin para compresión, éste sin comprimir y con información de depuración
          compress: false,
          linenos: true,
          //paths: ['path/to/import', 'another/to/import'],
          // use embedurl('test.png') in our code to trigger Data URI embedding
          urlfunc: 'embedurl',
          banner: assetsBannerTpl
          /*use: [
            require('fluidity') // use stylus plugin at compile time
          ],
          import: [      //  @import 'foo', 'bar/moo', etc. into every .styl file
            'foo',       //  that is compiled. These might be findable based on values you gave
            'bar/moo'    //  to `paths`, or a plugin you added under `use`
          ]*/
        },
        files: {
          'Styles/style.css': 'Styles/home.styl' // 1:1 compile
          //,'path/to/another.css': ['path/to/sources/*.styl', 'path/to/more/*.styl'] // compile and concat into single file
        }
      },
    },

    cssmin: {
      all: {
        options: {
          // Eliminamos todos los comentarios incluso el banner original
          keepSpecialComments: 0,
          // Se añade el banner de nuevo, que incluye un salto de línea antes del código
          banner: assetsBannerTpl
        },
        files: {
          'Styles/style.min.css': ['Styles/style.css']
        }
      }
    },
    
    watch: {
      js: {
        files: ['<%= jshint.all.files.src %>'],
        tasks: ['jshint', 'browserify'] // 'qunit', 'uglify'
      },
      css: {
        files: ['Stylus/**/*.styl'],
        tasks: ['stylus'] // 'cssmin'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  //grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('build', ['browserify', 'uglify']); // 'stylus', 'cssmin', 
  grunt.registerTask('build-dev', ['browserify']); // 'stylus', 

  grunt.registerTask('default', ['build', 'test']);

};