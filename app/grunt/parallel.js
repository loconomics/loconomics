'use strict';

module.exports = {
    'build-app': {
        options: {
            grunt: true
        },
        tasks: [
            'build-js',
            'build-css',
            'build-html',
            'build-images',
            'build-fonts'
        ]
    },
    'build-webapp': {
        options: {
            grunt: true
        },
        tasks: [
            'build-js',
            'build-css',
            'build-webapp-html',
            'build-images',
            'build-fonts'
        ]
    }
};
