'use strict';

module.exports = {
    // Default task builds everything and run tests (linting included in 'build-js' as part of 'build')
    'default': [
        'prepare-for-build',
        'build',
        'build-landingPages',
        'build-webapp',
        'test'
    ],
    // RELEASE: Make a clean* build of everything to publish a version on the web
    // *clean web directories from here is not allowed by grunt-clean
    // Remember to increase version at package.json. `npm version patch` or 'minor'
    // can be used from console.
    // /web files to copy over: /web/assets, /web/welcome, /web/_specialRoutes/app.html
    // remember to git-tag version after
    'build-web-release': [
        'clean:build',
        'prepare-for-build',
        'build',
        'build-webapp',
        'build-landingPages',
        'publish-landingPages',
        'test'
    ],
    // Any preparation of the folder where building results will go
    'prepare-for-build': [
        'mkdir:build-assets-js',
    ],
    // Run JavaScript testing
    'test': [
        'browserify:tests',
        'mocha'
    ],
    'build-js': [
        'eslint',
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
