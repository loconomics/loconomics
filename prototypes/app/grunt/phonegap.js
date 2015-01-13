'use strict';

module.exports = function(grunt) {
    return {
        config: {
            root: './build',
            config: './phonegap/config.xml',
            cordova: './phonegap/.cordova',
            html : 'app.html',
            path: 'phonegaptemp',
            plugins: [],
            platforms: ['android'],
            releases: 'releases',
            // Must be set for ios to work.
            // Should return the app name.
            name: function(){
                //var pkg = grunt.file.readJSON('package.json');
                //return pkg.name;
                return grunt.package.name;
            },
            remote: {
                username: '',
                password: '',
                platforms: ['android', 'ios']
            }
        }
    };
};