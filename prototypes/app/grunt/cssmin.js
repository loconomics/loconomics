'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports = {   
    options: {
        // Eliminamos todos los comentarios incluso el banner original
        keepSpecialComments: 0,
        // Se añade el banner de nuevo, que incluye un salto de línea antes del código
        banner: assetsBannerTpl,
        /* NOTE: Disabled the advanced mode because causes next know problems with our code:
        - html:before{ background gradient }  it gets removed some rules, letting background white
        - most css after that gets broken
        */
        noAdvanced: true
    },
    all: {
        files: {
            './build/assets/css/app.min.css': ['./build/assets/css/app.css']
        }
    }
};