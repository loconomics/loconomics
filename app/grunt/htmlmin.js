'use strict';

var commonOptions = require('./htmlmin.settings');

module.exports = function(grunt) {

    var getLandingPagesFiles = require('./shared/getLandingPagesFiles');

    return {
        webapp: {
            options: commonOptions,
            files: {
                '../web/_specialRoutes/app.html': '../web/_specialRoutes/app.html'
            }
        },
        landingPagesBuild: {
            options: commonOptions,
            files: getLandingPagesFiles(grunt, 'build/welcome', 'build/welcome')
        },
        landingPagesWeb: {
            options: commonOptions,
            files: getLandingPagesFiles(grunt, '../web/welcome', '../web/welcome')
        }
    };
};