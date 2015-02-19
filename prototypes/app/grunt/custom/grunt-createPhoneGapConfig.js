/*
 * grunt-createPhoneGapConfig
 *
 * Process a template file to create the PhoneGap/Cordova
 * config.xml file.
 *
 * Copyright (c) 2015 Iago Lorenzo Salgueiro, contributors
 * Licensed under the MIT license.
 */
 
'use strict';

var path = require('path');
 
module.exports = function(grunt) {

    grunt.registerMultiTask('createPhoneGapConfig', 'Process a template file to create the PhoneGap/Cordova config.xml.', function() {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            template: grunt.option('template') || '',
            data: grunt.option('data') || grunt.package || {}
        });
        
        grunt.verbose.writeflags(options, 'Options');
        
        var dest = this.data.dest;
        
        // dest is a path that can include or not the 'config.xml' file name.
        if (!/(^|\/)config\.xml$/i.test(dest)) {
            dest = path.join(dest, 'config.xml');
        }
        
        grunt.log.writeln('Compiling PhoneGap config template ' + options.template);
        var template = grunt.file.read(options.template);
        var compiled = grunt.template.process(template, {
            data: options.data
        });

        grunt.file.write(dest, compiled);
    });
};