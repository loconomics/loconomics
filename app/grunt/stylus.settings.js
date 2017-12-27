/**
 * Settings for Stylus, shared with Stylify (Browserify transform to embed
 * Stylus files).
 * Some overrides may happen on each case
 */
'use strict';

module.exports = {
    // Let it remove whitespace; it actually takes less time no more to compile
    compress: true,
    // Line numbers in th CSS are not really helpful, disabled (has not proper source maps)
    linenos: false,
    // use embedurl('test.png') in our code to trigger Data URI embedding
    urlfunc: 'embedurl',
    'include css': true
};
