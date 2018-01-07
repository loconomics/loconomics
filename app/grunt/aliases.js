'use strict';

module.exports = {
    'default': [
        'build',
        'test-after-build'
    ],
    // If wants to run 'test' after a build, this task prevents doing duplicated work
    'test-after-build': [
        'browserify:tests',
        'mocha'
    ],
    // Run JavaScript testing
    'test': [
        'mkdir:build-assets-js',
        'browserify:appCommon',
        'browserify:tests',
        'mocha'
    ],
    'build-js': [
        'eslint',
        'mkdir:build-assets-js',
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
        'copyto:images'
    ],
    'build-fonts': [
        'copyto:bootstrap-fonts',
        'copyto:font-awesome-fonts',
        'copyto:ionicons-fonts'
    ],
    'build-html': [
        'replace:html_bad_chars',
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

    'build-webapp-html': [
        'replace:html_bad_chars',
        'bliss:webapp',
        // TODO Fix problem with htmlmin; disabled temporarly
        //'htmlmin:webapp'
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
