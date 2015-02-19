/** Grunt tasks configuration
**/
module.exports = function (grunt) {

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt);
    
    //grunt.loadTasks('./grunt/custom/');
    
    grunt.task.run('notify_hooks');
};