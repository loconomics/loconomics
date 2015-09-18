'use strict';

var util = require('util');

// Takes grunt-browserify aliasMappings config and converts it into an alias array
// http://stackoverflow.com/questions/20134063/grunt-browserify-alisamapping-two-levels-deep
module.exports = function(grunt) {
	return function aliasMappingsToAliasArray(aliasMappings) {
		var aliasArray = [];
		var aliases = util.isArray(aliasMappings) ? aliasMappings : [aliasMappings];
		
        aliases.forEach(function (alias) {
			grunt.file.expandMapping(alias.src, alias.dest, {cwd: alias.cwd}).forEach(function(file) {
				var expose = file.dest.substr(0, file.dest.lastIndexOf('.'));
				aliasArray.push('./' + file.src[0] + ':' + expose);
			});
		});
		
        return aliasArray;
	};
};