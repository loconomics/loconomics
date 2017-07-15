'use strict';

module.exports = {

    // Watchs changes in project set-up files, as package.json and Grunt tasks
    setupChange: {
        files: [
            './package.json',
            'Gruntfile.js',
            'grunt/**/*.js',
        ],
        tasks: [
            'newer:jshint:grunt',
            'build',
            'notify:setupChangeBuild'
        ],
        options: {
            reload: true
        }
    },

    js: {
        files: ['<%= jshint.app.src %>'],
        tasks: [
            'newer:jshint:app'
        ]
    },

    css: {
        files: ['./source/css/**/*.styl', './source/css/**/*.css', 'Gruntfile.js'],
        tasks: [
            'stylus:app',
            'cssmin:app',
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

    landingPages: {
        files: [
            './source/css/**/*.styl',
            './source/css/**/*.css',
            '<%= jshint.app.src %>',
            './source/html/**/*.html',
            './source/images/**/*.*'
        ],
        tasks: [
            'build-landingPages',
            'notify:landingPages'
        ]
    }
};