'use strict';

module.exports = {
    // Default task builds everything, lints and run tests
    // The 'dev' modifier is not supported; this is expected to use for CI and
    // to try all the processes
    'default': [
        'clean:build',
        'prepare-for-build',

        'build-js',
        'build-css',
        'build-html',
        'build-images',
        'build-fonts',

        'stylus:landingPages',
        'cssmin:landingPages',
        'bliss:landingPagesBuild',
        'htmlmin:landingPagesBuild',
        'copyto:landingPages_assets',

        'bliss:webapp',
        'copyto:webapp_assets',

        'copyto:phonegap',
        'copyto:phonegapcli_res',
        'copyto:platform_merges',
        'bliss:cordovaConfigJson',
        'bliss:phonegap',
        'bliss:cordovaConfigXml',
        'zip:phonegap',

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
        'uglify:appCommon',
        'uglify:appActivities'
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
    'build-webapp-parallel': [
        'parallel:build-webapp',
        'copyto:webapp_assets'
    ],
    'build-webapp': [
        'build-js',
        'build-css',
        'build-webapp-html',
        'build-images',
        'build-fonts',
        'copyto:webapp_assets'
    ],
    'atwork': [
        'connect:atbuild',
        // Build all to ensure we are up-to-date when starting to work (specially
        // when switching branches or after pull content), since the js build most
        // times will be incremental now, will not be a huge problem (while previously
        // with watchAppCommon it was all the time a slow full build)
        'build',
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
