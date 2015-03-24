'use strict';

module.exports = {
    'libs': {
        // Not sure if #709 affects this too, but being conservative until further investigation results
        'options': { compress: false },
        'files': {
            './build/assets/js/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'options': {
            // Some recommended settings from http://discuss.emberjs.com/t/uglify-breaks-ember/5557
            // BUT did not fix the problem with advanced options, so compress is disabled at all.
            // See #709 for investigation about that.
            compress: false,
            /*compress: {
                global_defs: {
                    DEBUG: false,
                    RELEASE: false
                },
                sequences: true,
                properties: true,
                drop_debugger: true,
                unsafe: false,
                conditionals: true,
                comparisons: true,
                evaluate: true,
                booleans: true,
                dead_code: true,
                loops: true,
                unused: true,
                hoist_funs: false,
                hoist_vars: false,
                if_return: true,
                join_vars: true,
                cascade: true,
                warnings: false,
                negate_iife: false,
                pure_getters: false,
                pure_funcs: null,
                drop_console: true
            },
            preserveComments: false,
            report: 'gzip',
            screw_ie8: true,*/
            
            // To look for compression warnings only:
            /*compress: {
                warnings: false
            },*/
            
            // Reduce variable names
            mangle: true
        },
        'files': {
            './build/assets/js/app.min.js': ['<%= browserify.app.dest %>']
        }
    },
    'styleguidelibs': {
        // Not sure if #709 affects this too, but being conservative until further investigation results
        'options': { compress: false },
        'files': {
            './build/assets/js/styleguidelibs.min.js': ['<%= browserify.styleguidelibs.dest %>']
        }
    }
};