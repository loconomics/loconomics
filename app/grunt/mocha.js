'use strict';

module.exports = function() {
    return {
        test: {
            src: ['source/test/**/*.html'],
            options: {
                reporter: 'Spec'
            }
        }
    };
};
