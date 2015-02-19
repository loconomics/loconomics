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
        tasks: [
            'jshint:app',//'newer:jshint',
            'browserify:app',
            'notify:browserify',
            'uglify:app' //'newer:uglify'
        ]
    },
    
    css: {
        files: ['./source/css/**/*.styl', './source/css/**/*.css', 'Gruntfile.js'],
        tasks: ['build-css']
    },
    
    html: {
        files: ['./source/html/app.js.html', './source/html/activities/*.html', './source/html/modals/*.html'],
        tasks: ['build-html']
    },
    
    package: {
        files: ['./package.json'],
        tasks: ['build']
    }
};