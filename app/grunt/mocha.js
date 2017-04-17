'use strict';

module.exports = function() {
    return {
        test: {
            src: ['source/html/test/**/*.html'],
            options: {
                reporter: 'Spec'
            }
        }
    };
};
