'use strict';

module.exports = {
    'phonegap': {
        expand: true,
        cwd: 'phonegap/',
        // NOTE: for some ugly reason, grunt-zip requires repeat the cwd directory
        // in the src paths, but the directory root name is not included in the zip as
        // expected. (In other grunt tasks is different, like copy-to)
        src: [
            'phonegap/www/**/*.*',
            'phonegap/hooks/*.*',
            'phonegap/.cordova/*.*',
            // NOTE: grunt-zip is failing here, for some ugly reason, it requires
            // one extra entry at the end without the cwd to actual file (despite
            // it is discarded) to not return an error. Using config.xml, already
            // included in previous 'www' rule.
            'www/config.xml'
        ],
        dest: './build/latest.zip',
        dot: true
    }
};
