'use strict';

// Options are
/*
    title: string, // optional
    message: string // required
*/
module.exports = {
    build: {
        options: {
            title: 'Build complete',
            message: 'Build finished successfully.'
        }
    },
    setupChangeBuild: {
        options: {
            title: 'Build after setup change',
            message: 'Success! Auto-reload would happens now.'
        }
    },
    browserify: {
        options: {
            title: 'Browserify build complete',
            message: 'Browserify build finished successfully.'
        }
    },
    css: {
        options: {
            title: 'CSS build complete',
            message: 'CSS build finished successfully.'
        }
    },
    html: {
        options: {
            title: 'HTML build complete',
            message: 'HTML build finished successfully.'
        }
    },
    phonegap: {
        options: {
            title: 'PhoneGap build complete',
            message: 'PhoneGap build finished successfully.'
        }
    },
    images: {
        options: {
            title: 'Images copy',
            message: 'Images copied successfully.'
        }
    },
    landingPages: {
        options: {
            title: 'Landing Pages',
            message: 'Landing Pages build successfully.'
        }
    }
};
