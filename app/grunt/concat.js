'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports ={
    options: {
        'banner': assetsBannerTpl
    },
    'css-libs': {
        src: [
            './vendor/bootstrap/css/bootstrap.css',
            './vendor/bootstrap-switch/custom-css/bootstrap-switch.css',
            './vendor/font-awesome/css/font-awesome.css',
            './vendor/ionicons/css/ionicons.css'
        ],
        dest: './build/assets/css/libs.css'
    }
};
