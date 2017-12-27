/**
 * Task 'build-dev', notice to warn about using 'build --dev' instead.
 */
'use strict';
const TASK_NAME = 'build-dev';
/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    grunt.registerTask(TASK_NAME, 'Refactored Build App for DEV', function() {
        grunt.fail.fatal('REPLACE "build-dev" with "build --dev"');
    });
};
