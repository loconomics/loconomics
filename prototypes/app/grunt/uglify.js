'use strict';

module.exports = {
    'libs': {
        'files': {
            './build/assets/js/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'options': {
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
            },*/
            compress: {
                warnings: false
            },
            /*mangle: false,
            preserveComments: false,
            report: 'gzip',
            screw_ie8: true*/
        },
        'files': {
            './build/assets/js/app.min.js': ['<%= browserify.app.dest %>']
        }
    },
    'styleguidelibs': {
        'files': {
            './build/assets/js/styleguidelibs.min.js': ['<%= browserify.styleguidelibs.dest %>']
        }
    }
};