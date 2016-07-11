'use strict';

module.exports = {
    html_bad_chars: {
        src: ['source/html/**/*.html'],
        overwrite: true,
        replacements: [{
            // Common bad comile from Mac keyboard or copy paste from some documents
            from: '’',
            to: '\''
        }]
    }
};
