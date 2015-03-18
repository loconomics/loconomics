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
            './vendor/bootstrap/css/bootstrap.min.css',
            './vendor/bootstrap-switch/css/bootstrap3/bootstrap-switch.min.css'
        ],
        dest: './build/assets/css/libs.min.css'
    }
};
