'use strict';

module.exports = {
    options: {
        // Remove all but first 'banner' comment
        specialComments: 1,
        report: 'min'
    },
    app: {
        files: {
            './build/assets/css/app.min.css': ['./build/assets/css/app.css']
        }
    },
    libs: {
        files: {
            './build/assets/css/libs.min.css': ['./build/assets/css/libs.css']
        }
    },
    landingPages: {
        files: {
            './build/assets/css/welcome.min.css': ['./build/assets/css/welcome.css']
        }
    }
};