'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports ={
    options: {
        'banner': assetsBannerTpl
    },
    /*
    'js-all': {
        options: { separator: ';' },
        src: ['./Scripts/libs.min.js', './Scripts/app.min.js'],
        dest: './Scripts/all.min.js'
    },
    */
    'css-libs': {
        src: [
            './vendor/bootstrap/css/bootstrap.css',
            './vendor/bootstrap-switch/custom-css/bootstrap-switch.css',
            './vendor/jquery-ui/jquery-ui.css',
            './vendor/font-awesome/css/font-awesome.css',
            './vendor/ionicons/css/ionicons.css'
        ],
        dest: './build/assets/css/libs.css'
    },
    'css-splash-libs': {
        src: [
            './vendor/bootstrap/css/bootstrap.css',
            './vendor/font-awesome/css/font-awesome.css',
            './vendor/ionicons/css/ionicons.css'
        ],
        dest: './build/assets/css/splash-libs.css'
    }
};
