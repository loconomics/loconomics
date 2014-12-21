'use strict';

module.exports = {
	'default': [
		'build',
		'test'
	],
	// 'qunit-test': [
		// 'connect:qunit',
		// 'qunit'
	// ],
	'test': [
		'jshint'//'newer:jshint:all',
		//,'qunit'
	],
	'build-js': [
		'jshint',//'newer:jshint',
		'browserify',
		'uglify',//'newer:uglify'
        'notify:browserify'
	],
	'build-css': [
		'stylus',
		'cssmin',//'newer:cssmin'
        'notify:css'
	],

	'build-dev': [
		'browserify',
		'stylus',
        'notify:build'
	],
	'build': [
        'build-js',
		'build-css',
        'notify:build'
	]
};
