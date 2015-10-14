'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports = {
    options: {
        // Se usa cssmin para compresión, éste sin comprimir y con información de depuración
        compress: false,
        linenos: true,
        //paths: ['path/to/import', 'another/to/import'],
        // use embedurl('test.png') in our code to trigger Data URI embedding
        urlfunc: 'embedurl',
        'include css': true,
        banner: assetsBannerTpl
        /*
        import: [      //  @import 'foo', 'bar/moo', etc. into every .styl file
        'foo',       //  that is compiled. These might be findable based on values you gave
        'bar/moo'    //  to `paths`, or a plugin you added under `use`
        ]*/
    },
    app: {
        files: {
            'build/assets/css/app.css': ['./source/css/app.styl']
        }
    },
    splash: {
        files: {
            'build/assets/css/splash.css': ['./source/css/splash.styl']
        }
    }
};