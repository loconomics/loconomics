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
    'build-html': [
        //'copyto:html', // Now, html files are bundled with bliss
        'bliss:app',
        'bliss:appDebug',
        'notify:html'
    ],
    'prepare-phonegap': [
        'bliss:phonegap',
        'copyto:phonegap',
        'copyto:platform_merges',
        'notify:phonegap'
    ],

	'build-dev': [
		'browserify',
		'stylus',
        'bliss:appDebug',
        'notify:build'
	],
	'build': [
        'build-js',
		'build-css',
        'build-html',
        'build-phonegap',
        'notify:build'
	]
};
