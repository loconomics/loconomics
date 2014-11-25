'use strict';

var assetsBannerTpl = require('./shared/assetsBannerTpl');

module.exports = {   
    options: {
        // Eliminamos todos los comentarios incluso el banner original
        keepSpecialComments: 0,
        // Se añade el banner de nuevo, que incluye un salto de línea antes del código
        banner: assetsBannerTpl
    },
    all: {
        files: {
            './assets/proto.min.css': ['./assets/proto.css']
        }
    }
};