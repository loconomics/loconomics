'use strict';

module.exports = {
    'libs': {
        // Disabled conservative settings, enable if some bugs happens using minified files.
        //'options': { compress: false, mangle: false },
        'files': {
            './build/assets/js/libs.min.js': ['<%= browserify.libs.dest %>']
        }
    },
    'app': {
        'options': {
            // Custom optimizations to avoid bugs:
            // - #709: use of Function.name by Models/Activities;
            //compress: false,
            compress: {
                sequences     : true,  // join consecutive statemets with the “comma operator”
                properties    : true,  // optimize property access: a["foo"] → a.foo
                dead_code     : true,  // discard unreachable code
                drop_debugger : true,  // discard “debugger” statements
                unsafe        : false, // some unsafe optimizations (see below)
                conditionals  : true,  // optimize if-s and conditional expressions
                comparisons   : true,  // optimize comparisons
                evaluate      : true,  // evaluate constant expressions
                booleans      : true,  // optimize boolean expressions
                loops         : true,  // optimize loops
                // Iago: Additionally to drop unused vars/funcs, it drops the functions names too
                // causing the bug #709 (we use Function.name).
                // I had set-up jshint to notify about actual unused bars/funcs so
                // compression stage is not reach if that happens.
                unused        : false, // drop unused variables/functions
                hoist_funs    : false, // hoist function declarations
                hoist_vars    : false, // hoist variable declarations
                if_return     : true,  // optimize if-s followed by return/continue
                join_vars     : true,  // join var declarations
                cascade       : true,  // try to cascade `right` into `left` in sequences
                side_effects  : true,  // drop side-effect-free statements
                warnings      : true,  // warn about potentially dangerous optimizations/code
                global_defs   : {}     // global definitions
            },
            //report: 'gzip',

            // To look for compression warnings only:
            /*compress: {
                warnings: true
            },*/
            
            // Reduce variable names
            // IMPORTANT: Disabled because it causes the bug #709, the problem is that
            // it changes the functions names too and we are using them, for example when
            // managing Activities singletons.
            // See: http://lisperator.net/uglifyjs/mangle (third point, unavoidable)
            // If in the future becomes an option to avoid mangle function names, can be used.
            mangle: false
        },
        'files': {
            './build/assets/js/app.min.js': ['<%= browserify.app.dest %>']
        }
    },
    'styleguidelibs': {
        // Disabled conservative settings, enable if some bugs happens using minified files.
        //'options': { compress: false, mangle: false },
        'files': {
            './build/assets/js/styleguidelibs.min.js': ['<%= browserify.styleguidelibs.dest %>']
        }
    },
    'splash': {
        // Disabled conservative settings, enable if some bugs happens using minified files.
        //'options': { compress: false, mangle: false },
        'files': {
            './build/assets/js/splash.min.js': ['<%= browserify.splash.dest %>']
        }
    }
};