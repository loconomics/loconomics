/*
 * grunt-prepare-bootstrap-variables
 *
 * Copyright (c) 2014 Iago Lorenzo Salgueiro, contributors
 * Licensed under the MIT license.
 */
 
'use strict';

module.exports = function(grunt) {

    grunt.registerTask('prepare-bootstrap-variables', 'Create variables.less and variables.styl from Custom Bootstrap build at /vendor/bootstrap.', function() {
        var prepare = require('../../vendor/bootstrap/prepare');
        prepare.build();
    });

};