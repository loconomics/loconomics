/**
 * Set-up for Exorcise task, that moves source-maps contained
 * in js files (Browserify bundles) to external files, making
 * dev files smaller.
 */
'use strict';

module.exports = {
    app: {
        files: {
            './build/assets/js/app.js.map': ['./build/assets/js/app.js']
        },
        options: {
            strict: true
        }
    },
    landingPages: {
        files: {
            './build/assets/js/welcome.js.map': ['./build/assets/js/welcome.js']
        },
        options: {
            strict: true
        }
    },
    tests: {
        files: {
            './build/assets/js/tests.js.map': ['./build/assets/js/tests.js']
        },
        options: {
            strict: true
        }
    }
};
