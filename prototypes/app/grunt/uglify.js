'use strict';

module.exports = {
    'libs': {
        'files': {
            './assets/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'files': {
            './assets/app.min.js': ['<%= browserify.app.dest %>']
        }
    }
};