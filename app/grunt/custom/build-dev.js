/**
 * Task 'build-dev', alias to running 'build --dev' with warning.
 * Check './build' for more info
 */
'use strict';
const TASK_NAME = 'build-dev';
/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    grunt.registerTask(TASK_NAME, 'Refactored Build App for DEV', function() {
        console.error('UPDATE: Replace "build-dev" with "build --dev"');
    });
};
