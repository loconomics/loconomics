'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports = {
    options: {
        // Let it remove whitespace; it actually takes less time no more to compile
        compress: true,
        // Line numbers in th CSS are not really helpful, disabled (has not proper source maps)
        linenos: false,
        // use embedurl('test.png') in our code to trigger Data URI embedding
        urlfunc: 'embedurl',
        'include css': true,
        banner: assetsBannerTpl
    },
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