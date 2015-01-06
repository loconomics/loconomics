'use strict';

module.exports = {
    grunt: {
        files: [
            'Gruntfile.js',
            'grunt/**/*.js',
        ],
        tasks: [
            'jshint:grunt', //'newer:jshint:grunt',
            'build',
        ]
    },
    
    js: {
        files: ['<%= jshint.app.src %>'],
        tasks: ['build-js']
    },
    
    css: {
        files: ['./source/css/**/*.styl', './source/css/**/*.css', 'Gruntfile.js'],
        tasks: ['build-css']
    },
    
    html: {
        files: ['./source/html/app.html', './source/html/activities/*.html', './source/html/modals/*.html'],
        tasks: ['build-html']
    }
};