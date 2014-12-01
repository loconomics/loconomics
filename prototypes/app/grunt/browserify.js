'use strict';

module.exports = function(grunt) {

    var getPublicModulesFrom = require('./shared/getPublicModulesFrom');

    /**
        Browserify config
    **/
	var bconfig = {};
    
    /**
        Libs bundle
    **/
    bconfig.libs = {
        'src': [],
        'dest': './assets/libs.js',
        'options': {
            'debug': false,
            'external': [
                'jquery'
            ],
            'alias': [
                'moment',
                'knockout'
            ],
            'shim': {
                'jquery-mobile':  {
                    'path': './vendor/jquerymobile/jquery.mobile.custom.min.js',
                    'exports': null,
                    'depends': { 'jquery': null }
                }
            }
        }
    };

    /**
        App bundle
    **/
    bconfig.app = {
        'src': [
            './js/app.js'
        ],
        'dest': './assets/app.js',
        'options': {
            // Enable debug evern when compiling script.js, the min.js will delete debug info for production use:
            'debug': true,
            // Modules from other bundles
            'external': Array.prototype.concat(
                // From libs bundle
                getPublicModulesFrom(bconfig.libs),
                [ 'jquery' ]
            )
        }
    };

    return bconfig;
};