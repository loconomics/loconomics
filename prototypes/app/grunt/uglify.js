'use strict';

module.exports = {
    'libs': {
        'files': {
            './build/assets/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'files': {
            './build/assets/app.min.js': ['<%= browserify.app.dest %>']
        }
    }
};