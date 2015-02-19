'use strict';

module.exports = {
    'options': {
        template: './source/phonegap-config.tpl.xml',
        data: {
            id: 'com.loconomics.app',
            phonegapbuild_id: 1266913,
            version: '<%= package.version %>',
            name: '<%= package.appName %>',
            description: '<%= package.appDescription %>',
            author: {
              email: 'support@loconomics.com',
              url: 'https://loconomics.com',
              text: '<%= package.author %>'
            }
        }
    },
    'phonegap': {
        'dest': './phonegap/www/'
    }
};
