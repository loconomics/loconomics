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
        tasks: [
            'stylus:app',
            'cssmin:app',//'newer:cssmin:app'
            'notify:css'
        ]
    },
    
    images: {
        files: ['./source/images/**/*.png', './source/images/**/*.jpg', './source/images/**/*.svg', './source/images/**/*.ico'],
        tasks: [
            'copyto:images',
            'notify:images'
        ]
    },
    
    html: {
        files: ['./source/html/app.js.html', './source/html/**/*.html', './source/html/modals/*.html'],
        tasks: ['build-html']
    },
    
    configXml: {
        files: ['./source/cordova-config.js.xml'],
        tasks: ['bliss:cordovaConfigXml']
    },
    
    configJson: {
        files: ['./source/cordova-config.js.json'],
        tasks: ['bliss:cordovaConfigJson']
    },
    
    package: {
        files: ['./package.json'],
        tasks: ['build']
    }
};