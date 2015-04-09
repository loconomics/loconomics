/**
    Small utility to search a text fragment using
    case insensitive, accent/symbol insensitive.
**/
'use strict';

var removeAccent = require('./removeAccent');

module.exports = function textSearch(search, text) {

    var s = removeAccent(search).toLowerCase(),
        t = removeAccent(text).toLowerCase();

    return t.indexOf(s) > -1;
};
