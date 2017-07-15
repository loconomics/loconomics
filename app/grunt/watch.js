/**
 * Set-up for watch task.
 * There are several groups of sub-tasks that can be set-up here, given
 * a command line parameter 'target' with the value being the key of
 * any property defined below as part of TARGETS.
 *
 * This is needed because of a limitation of the watch task: to trigger
 * file specific tasks, a sub-task need to be set-up with specific file
 * pattern; but you cannot ask Grunt to run several watch tasks at once,
 * because the first will block the process and following ones never are call.
 * Alternatives as use 'parallel' are slower, too verbose in the console and
 * prevents from using auto-reloading (as when Grunt file change happens).
 *
 * Examples:
 * > grunt watch
 * > grunt watch --target=app
 * > grunt watch --target=landing_pages
 */
'use strict';

var DEFAULT_TARGET = 'APP';

var TARGETS = {};

TARGETS.APP = {
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
        files: ['./source/css/**/*.styl', './source/css/**/*.css'],
        tasks: [
            'stylus:app',
            'newer:cssmin:app',
            'notify:css'
        ]
    },

    images: {
        files: ['./source/images/**/*.png', './source/images/**/*.jpg', './source/images/**/*.svg', './source/images/**/*.ico'],
        tasks: [
            'newer:copyto:images',
            'notify:images'
        ]
    },

    html: {
        files: ['./source/html/app.js.html', './source/html/**/*.html', './source/html/modals/*.html'],
        tasks: ['build-html']
    },

    configXml: {
        files: ['./source/cordova-config.js.xml'],
        tasks: ['newer:bliss:cordovaConfigXml']
    },

    configJson: {
        files: ['./source/cordova-config.js.json'],
        tasks: ['newer:bliss:cordovaConfigJson']
    }
};

TARGETS.LANDING_PAGES = {
    // Watchs changes in project set-up files, as package.json and Grunt tasks
    setupChange: {
        files: [
            './package.json',
            'Gruntfile.js',
            'grunt/**/*.js',
        ],
        tasks: [
            'newer:jshint:grunt',
            'build-landingPages',
            'notify:setupChangeBuild'
        ],
        options: {
            reload: true
        }
    },

    js: {
        // All js source and bundle generation is shared with app/appCommon
        files: ['<%= jshint.app.src %>'],
        tasks: [
            // Just lint updated files
            'newer:jshint:app'
            // No browserify, the watchify-enabled task must be used
            // No notification on completion, we just let errors to get notified
        ]
    },

    css: {
        files: ['./source/css/**/*.styl', './source/css/**/*.css'],
        tasks: [
            'stylus:landingPages',
            'newer:cssmin:landingPages',
            'notify:landingPages'
        ]
    },

    images: {
        files: ['./source/images/**/*.png', './source/images/**/*.jpg', './source/images/**/*.svg', './source/images/**/*.ico'],
        tasks: [
            'newer:copyto:images',
            'notify:landingPages'
        ]
    },

    html: {
        files: ['./source/html/**/*.html'],
        tasks: [
            'newer:replace:html_bad_chars',
            'bliss:landingPagesBuild',
            'newer:htmlmin:landingPagesBuild',
            'notify:landingPages'
        ]
    }
};

module.exports = function(grunt) {

    var targetName = (grunt.option('target') || DEFAULT_TARGET).toUpperCase();
    var target = TARGETS[targetName];

    // A reminder when calling this from another task/alias like 'atwork'
    grunt.log.warn('Will be ready when a \'Waiting...\' line appear below');
    // Let know that target is correctly set
    grunt.log.writeln('TARGET', targetName, 'exists:', !!target);

    if (target) {
        return target;
    }
    else {
        grunt.verbose.error();
        grunt.fail.warn('The given target name don\'t exist (' + targetName + ')');
    }
};