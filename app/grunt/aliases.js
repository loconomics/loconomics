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
		'browserify:styleguidelibs',
		'browserify:libs',
		'browserify:app',
		'uglify',//'newer:uglify'
        'notify:browserify'
	],
	'build-css': [
        'concat:css-libs',
		'stylus:app',
		'cssmin:libs',//'newer:cssmin'
		'cssmin:app',//'newer:cssmin'
        'notify:css'
	],
    'build-images': [
        'copyto:images',
        'copyto:jqueryuiimages',
        'notify:images'
    ],
    'build-fonts': [
        'copyto:bootstrap-fonts',
        'copyto:font-awesome-fonts',
        'copyto:ionicons-fonts'
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
        'bliss:cordovaConfigJson',
        'bliss:cordovaConfigXml',
        'notify:phonegap'
    ],
    
    'prepare-phonegapbuild': [
        // Create 'DEV' version files on phonegap folder and bundle
        'bliss:phonegapDev',
        'bliss:cordovaConfigXmlDev',
        'zip:phonegapDev',
        
        // Create 'LIVE' version files on phonegap folder (it replace previous ones) and bundle
        'bliss:phonegap',
        'bliss:cordovaConfigXml',
        'zip:phonegap'
    ],
    
    //TODO: task that uses the PhoneGapBuild REST API to upload for build, using environment credentials

	'build-dev': [
		'browserify',
		'stylus:app',
        'bliss:appDebug',
        'notify:build'
	],
	'build': [
        'build-js',
        'prepare-bootstrap-variables',
		'build-css',
        'build-html',
        'build-images',
        'build-fonts',
        'prepare-phonegap',
        'prepare-phonegapbuild',
        'notify:build'
	],
	'build-webapp': [
        'build-js',
        'prepare-bootstrap-variables',
		'build-css',
        'bliss:webapp',
        'notify:html',
        'build-images',
        'build-fonts',
        'copyto:webapp_assets',
        'notify:build'
	],
    'atwork': [
        'connect:atbuild',
        'watch'
    ],
    'build-splash': [
		'jshint',//'newer:jshint',
		'browserify:splash',
		'uglify:splash',//'newer:uglify:splash'
        'notify:browserify',
        'concat:css-splash-libs',
		'stylus:splash',
		'cssmin:splash',//'newer:cssmin:splash'
        'notify:css',
        'bliss:splash',
        'notify:html',
        'build-fonts',
        'copyto:images',
        'notify:build'
    ]
};
