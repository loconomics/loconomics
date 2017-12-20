'use strict';

var insertCss = require('insert-css');
var style = require('./trialcss.styl');

document.addEventListener("DOMContentLoaded", () => {
    var styleEl = insertCss(style, {
        container: document.getElementById('container')
    });

    const dispose = () => {
        styleEl.remove();
    };

    setTimeout(function() {
        document.getElementById('container').classList.add('done');

        setTimeout(dispose, 4000);
    }, 3000);
});
