'use strict';

module.exports = {
    html: {
        expand: true,
        cwd: 'source/html/',
        src: ['activities/*.html', 'modals/*.html'],
        dest: 'build/',
        filter: 'isFile'
    },
    phonegap: {
        expand: true,
        cwd: 'build/',
        src: ['assets/**/*.*'],
        dest: 'phonegap/www/',
        filter: 'isFile'
    }
};