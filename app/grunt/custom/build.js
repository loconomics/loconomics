/**
 * Task 'build' with modifiers.
 * Check ../aliases for other tasks with prefix 'build-', while this one
 * is just 'build' plus console parameters, accepted now:
 * - '--dev' Development mode: enable source maps, debugging versions of some
 *      modules. Other Grunt tasks/settings read this parameter too, keep in
 *      sync.
 */
'use strict';
const TASK_NAME = 'build';
/**
 * Parameter/option that sets environment as 'development'
 * @const {string}
 */
const DEV_ENV = 'dev';
/**
 * Tasks list to build for Production environment
 * @const {Array<string>}
 */
const PRODUCTION_TASKS = ['parallel:build-app'];
/**
 * Tasks list to build for Development environment
 * @const {Array<string>}
 */
const DEV_TASKS = [
    'browserify:appCommon',
    'prepare-bootstrap-variables',
    'concat:css-libs',
    'stylus:app',
    'copyto:images',
    'build-fonts',
    'bliss:appDebug'
];
/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    grunt.registerTask(TASK_NAME, 'Build App', function() {
        const isDevEnv = !!grunt.option(DEV_ENV);
        let tasks;
        if (isDevEnv) {
            tasks = DEV_TASKS;
        }
        else {
            tasks = PRODUCTION_TASKS;
        }
        // Run
        grunt.task.run.apply(grunt.task, tasks);
    });
};
