'use strict';

module.exports = {
    webapp: {
        options: {
            collapseWhitespace: true,
            // keep 1 whitespace, since some elements may expect some space between them rather than rely on CSS margins
            conservativeCollapse: true,
            removeTagWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true,
            // ignore knockout comments
            ignoreCustomComments: [
                /^\s+ko/,
                /\/ko\s+$/
            ]
        },
        files: {
            '../web/_specialRoutes/app.html': '../web/_specialRoutes/app.html'
        }
    }
};