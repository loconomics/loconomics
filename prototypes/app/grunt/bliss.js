'use strict';

module.exports = function(grunt) {

    var includedPatterns = ['modals/**/*.html', 'activities/**/*.html'];
    var includedDir = 'source/html/';
    var includedFiles = grunt.file.expand({
        cwd: includedDir,
        filter: grunt.file.isFile
    }, includedPatterns);
    
    return {
        app: {
          files: {
            'build/app.html': ['source/html/app.js.html']
          },
          options: {
            context: {
                debug: false,
                includedFiles: includedFiles
            }
          }
        },
        appDebug: {
          files: {
            'build/appDebug.html': ['source/html/app.js.html']
          },
          options: {
            context: {
                debug: true,
                includedFiles: includedFiles
            }
          }
        }
    };
};