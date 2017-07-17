'use strict';

module.exports = {
    'default': [
        'build',
        'test'
    ],
    'test': [
        'browserify:appCommon',
        'browserify:tests',
        'mocha'
    ],
    'build-js': [
        'jshint',
        'browserify:appCommon',
        'uglify:appCommon'
    ],
    'build-css': [
        'concat:css-libs',
        'stylus:app',
        'cssmin:libs',
        'cssmin:app'
    ],
    'build-images': [
        'copyto:images',
        'copyto:jqueryuiimages'
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
        'bliss:appDebug'
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
        'bliss:appDebug'
    ],
    'build': [
        'build-js',
        'prepare-bootstrap-variables',
        'build-css',
        'build-html',
        'build-images',
        'build-fonts',
    ],
    'build-webapp-html': [
        'bliss:webapp',
        'htmlmin:webapp',
        'copyto:webapp_assets'
    ],
    'build-webapp': [
        'build-js',
        'prepare-bootstrap-variables',
        'build-css',
        'build-webapp-html',
        'build-images',
        'build-fonts',
        'copyto:webapp_assets'
    ],
    'atwork': [
        'connect:atbuild',
        'browserify:watchAppCommon',
        'watch'
    ],
    'build-landingPages': [
        'stylus:landingPages',
        'cssmin:landingPages',
        'replace:html_bad_chars',
        'bliss:landingPagesBuild',
        'htmlmin:landingPagesBuild',
        'copyto:images',
        'browserify:appCommon'
    ],
    'publish-landingPages': [
        'bliss:landingPagesWeb',
        'uglify:appCommon',
        'htmlmin:landingPagesWeb',
        'copyto:landingPages_assets'
    ]
};
