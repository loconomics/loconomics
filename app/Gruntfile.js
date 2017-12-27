/** Grunt tasks configuration
**/
module.exports = function (grunt) {
    /* eslint-env node */
    /* eslint no-process-env:0 */

    // WORKAROUND Node 8.9.x and Connect using http2 still experimental
    if(!process.env['NODE_NO_HTTP2']) {
        process.env['NODE_NO_HTTP2'] = 1;
    }
    // WORKAROUND 'atwork' task is only used for a 'dev' env, but before we
    // didn't need a '--dev' flag, making it implicit when running that task
    var inAtwork = grunt.cli.tasks.indexOf('atwork') > -1;
    if (inAtwork) {
        process.env['NODE_ENV'] = 'development';
    }

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt);

    grunt.loadTasks('./grunt/custom/');

    grunt.task.run('notify_hooks');
};