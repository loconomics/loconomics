/** Grunt tasks configuration
**/
module.exports = function (grunt) {
    /* eslint-env node */
    /* eslint no-process-env:0 */

    // WORKAROUND Node 8.9.x and Connect using http2 still experimental
    if(!process.env['NODE_NO_HTTP2']) {
        process.env['NODE_NO_HTTP2'] = 1;
    }

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt);

    grunt.loadTasks('./grunt/custom/');

    grunt.task.run('notify_hooks');
};