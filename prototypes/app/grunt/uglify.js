'use strict';

module.exports = {
    'libs': {
        'files': {
            './build/assets/js/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'files': {
            './build/assets/js/app.min.js': ['<%= browserify.app.dest %>']
        }
    }
};