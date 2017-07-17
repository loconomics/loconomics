'use strict';

module.exports = {
    images: {
        expand: true,
        cwd: 'source/images/',
        src: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.ico'],
        dest: 'build/assets/images/',
        filter: 'isFile'
    },
    jqueryuiimages: {
        expand: true,
        cwd: 'vendor/jquery-ui/images/',
        src: ['*.png'],
        dest: 'build/assets/css/images/',
        filter: 'isFile'
    },
    html: {
        expand: true,
        cwd: 'source/html/',
        src: ['activities/*.html', 'modals/*.html'],
        dest: 'build/',
        filter: 'isFile'
    },
    webapp_assets: {
        expand: true,
        cwd: 'build/assets/',
        src: ['js/{app,common}.min.js', 'css/{app,libs}.min.css', 'images/**/*.*', 'fonts/**/*.*'],
        dest: '../web/assets/',
        filter: 'isFile'
    },
    phonegap: {
        expand: true,
        cwd: 'build/',
        // NOTE: all files, minified and debug, are copied into phonegap, we include only minified css/js when ziping for phonegap-build
        src: ['assets/js/*.js', 'assets/css/*.css', 'assets/images/**/*.*', 'assets/fonts/**/*.*'],
        dest: 'phonegap/www/',
        filter: 'isFile'
    },
    // Phonegap needs the 'res' folder under different folder depending
    // on building locally with CLI or PhonegapBuild service.
    phonegapcli_res: {
        expand: true,
        cwd: 'source/res/',
        src: ['**/*.*'],
        dest: 'phonegap/res/',
        filter: 'isFile'
    },
    phonegapbuild_res: {
        expand: true,
        cwd: 'source/res/',
        src: ['**/*.*'],
        dest: 'phonegap/www/res/',
        filter: 'isFile'
    },
    platform_merges: {
        expand: true,
        dest: './phonegap/platforms/',
        cwd: './phonegap/platform-merges',
        src: '**/*.*'
    },
    'bootstrap-fonts': {
        expand: true,
        cwd: './vendor/bootstrap/fonts/',
        src: '*.*',
        dest: './build/assets/fonts/',
        filter: 'isFile'
    },
    'font-awesome-fonts': {
        expand: true,
        cwd: './vendor/font-awesome/fonts/',
        src: '*.*',
        dest: './build/assets/fonts/',
        filter: 'isFile'
    },
    'ionicons-fonts': {
        expand: true,
        cwd: './vendor/ionicons/fonts/',
        src: '*.*',
        dest: './build/assets/fonts/',
        filter: 'isFile'
    },
    landingPages_assets: {
        expand: true,
        cwd: 'build/assets/',
        src: ['js/welcome.min.js', 'css/welcome.min.css', 'images/**/*.*', 'fonts/**/*.*'],
        dest: '../web/assets/',
        filter: 'isFile'
    }
};