'use strict';

var commonOptions = {
    collapseWhitespace: true,
    // keep 1 whitespace, since some elements may expect some space between them rather than rely on CSS margins
    conservativeCollapse: true,
    removeTagWhitespace: false,
    removeAttributeQuotes: true,
    removeComments: true,
    // ignore knockout comments
    ignoreCustomComments: [
        /^\s+ko/,
        /\/ko\s+$/
    ]
};

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