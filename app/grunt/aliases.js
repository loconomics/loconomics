'use strict';

module.exports = {
    'default': [
        'build',
        'test'
    ],
    'test': [
        'browserify:appCommon',
        'exorcise:appCommon',
        'browserify:tests',
        'exorcise:tests',
        'mocha'
    ],
    'build-js': [
        'jshint',//'newer:jshint',
        'browserify:appCommon',
        'exorcise:appCommon',
        'uglify:appCommon',
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
        'browserify:appCommon',
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
    ],
    'atwork-landingPages': [
        'connect:atbuild',
        'watch:landingPages'
    ],
    'build-landingPages': [
        'stylus:landingPages',
        'cssmin:landingPages',
        'replace:html_bad_chars',
        'bliss:landingPagesBuild',
        'htmlmin:landingPagesBuild',
        'browserify:appCommon',
        'exorcise:appCommon',
        'uglify:appCommon'
    ],
    'publish-landingPages': [
        'bliss:landingPagesWeb',
        'htmlmin:landingPagesWeb',
        'copyto:landingPages_assets'
    ]
};
