'use strict';

module.exports = function(/*grunt*/) {
    /**
        Browserify config
    **/
	var bconfig = {
        options: {
            transform: [['stringify', {
                appliesTo: { includeExtensions: ['.html'] },
                minify: true,
                minifyAppliesTo: { includeExtensions: ['.html'] },
                minifyOptions: require('./htmlmin.settings')
            }]]
        }
    };

    /**
        App bundle
    **/
    bconfig.app = {
        'src': [
            './source/js/app.js'
        ],
        'dest': './build/assets/js/app.js',
        'options': {
            // Enable debug evern when compiling script.js, the min.js will delete debug info for production use:
            'debug': false
        }
    };

    return bconfig;
};
