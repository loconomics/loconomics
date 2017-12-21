'use strict';

var merge = require('deepmerge');
var assetsBannerTpl = require('./shared/assetsBannerTpl');
var sharedSettings = require('./stylus.settings');

module.exports = {
    options: merge(sharedSettings, {
        banner: assetsBannerTpl
    }),
    app: {
        files: {
            'build/assets/css/app.css': ['./source/css/app.styl']
        }
    },
    landingPages: {
        files: {
            'build/assets/css/welcome.css': './source/css/landingPage.styl'
        }
    }
};