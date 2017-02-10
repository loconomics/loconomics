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
        'replace:html_bad_chars',
        //'copyto:html', // Now, html files are bundled with bliss
        'bliss:app',
        'bliss:appDebug',
        'notify:html'
    ],


    'prepare-phonegapcli-live': [
        'copyto:phonegap',
        'copyto:phonegapcli_res',
        'copyto:platform_merges',
        'bliss:cordovaConfigJson',
        'bliss:phonegap',
        'bliss:cordovaConfigXml',
        'notify:phonegap'
    ],
    'prepare-phonegapcli-dev': [
        'copyto:phonegap',
        'copyto:phonegapcli_res',
        'copyto:platform_merges',
        'bliss:cordovaConfigJson',
        'bliss:phonegapDev',
        'bliss:cordovaConfigXml',
        'notify:phonegap'
    ],

    'prepare-phonegapbuild-live': [
        'copyto:phonegap',
        'copyto:phonegapbuild_res',
        'bliss:cordovaConfigJson',
        'bliss:phonegap',
        'bliss:cordovaConfigXml',
        'zip:phonegap',
        'notify:phonegap'
    ],
    'prepare-phonegapbuild-dev': [
        'copyto:phonegap',
        'copyto:phonegapbuild_res',
        'bliss:cordovaConfigJson',
        'bliss:phonegapDev',
        'bliss:cordovaConfigXmlDev',
        'zip:phonegapDev',
        'notify:phonegap'
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
        'notify:build'
	],
    'build-webapp-html': [
        'bliss:webapp',
        'htmlmin:webapp',
        'copyto:webapp_assets',
        'notify:html'
    ],
	'build-webapp': [
        'build-js',
        'prepare-bootstrap-variables',
		'build-css',
        'build-webapp-html',
        'build-images',
        'build-fonts',
        'copyto:webapp_assets',
        'notify:build'
	],
    'atwork': [
        'connect:atbuild',
        'watch'
    ]
};
