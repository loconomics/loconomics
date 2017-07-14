'use strict';

module.exports = {
    'atwork-watch': {
        options: {
            grunt: true,
            stream: true
        },
        tasks: [
            'browserify:watchAppCommon',
            'watch:js',
            'watch:setupChange',
            'watch:css',
            'watch:images',
            'watch:html',
            'watch:configXml',
            'watch:configJson'
        ]
    }
};
