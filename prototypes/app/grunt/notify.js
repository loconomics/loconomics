'use strict';

module.exports = {
    watch: {
        options: {
            title: 'Build complete (watch)',  // optional
            message: 'Build finished successfully.' //required
        }
    },
    build: {
        options: {
            title: 'Build complete',  // optional
            message: 'Build finished successfully.' //required
        }
    },
    browserify: {
        options: {
            title: 'Browserify build complete',  // optional
            message: 'Browserify build finished successfully.' //required
        }
    },
    css: {
        options: {
            title: 'CSS build complete',  // optional
            message: 'CSS build finished successfully.' //required
        }
    },
    html: {
        options: {
            title: 'HTML build complete',  // optional
            message: 'HTML build finished successfully.' //required
        }
    }
};