'use strict';

module.exports = {
    atbuild: {
        options: {
            port: 8801,
            hostname: 'localhost',
            base: 'build',
            keepalive: true
        }
    },
    phonegap: {
        options: {
            port: 8802,
            hostname: 'localhost',
            base: 'phonegap/www',
            keepalive: true
        }
    }
};
