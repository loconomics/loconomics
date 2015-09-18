'use strict';

module.exports = {
    options: {
        //livereload: 35729
    },
    atbuild: {
        options: {
            port: 8811,
            hostname: 'localhost',
            base: 'build'
            // A watch task after this already keeps alive the script :-)
            // keepalive: true,
            //open: true
        }
    },
    phonegap: {
        options: {
            port: 8812,
            hostname: 'localhost',
            base: 'phonegap/www',
            keepalive: true
        }
    }
};
