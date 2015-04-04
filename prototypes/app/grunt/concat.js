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
            './vendor/jquery-ui/jquery-ui.css'
        ],
        dest: './build/assets/css/libs.css'
    }
};
