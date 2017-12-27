'use strict';

module.exports = {
    options: require('./cssmin.settings.js'),
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