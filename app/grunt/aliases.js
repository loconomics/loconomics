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
        'prepare-bootstrap-variables',
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
        'parallel:build-app'
    ],
    'build-webapp-html': [
        'replace:html_bad_chars',
        'bliss:webapp',
        'htmlmin:webapp'
    ],
    'build-webapp-html-copy': [
        'build-webapp-html',
        'copyto:webapp_assets'
    ],
    'build-webapp': [
        'parallel:build-webapp',
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
