// Just generates a valid Stylus (.styl) file with the
// variables from the config.json file found in the
// current directory
// It replaces the prefix '@' by '$' (since that is not
// valid as variable prefix in Stylus; a prefix is not required
// but using $ as convention).
// NOT COMPLETE FOR LESS CONFIGS (the ones from Bootstrap):
// In the config values are Less expressions, need to be
// converted to equivalent Stylus built-in or 'nib' functions.
// Best to use 'less2stylus' module from a less source tranlated with config2less-vars.js
'use strict';

var config = require('./config.json');

if (config && config.vars) {
    
    console.log('// Variables from config.json');
    
    Object.keys(config.vars).forEach(function(key) {
        var varname = key.replace(/^@/, '$');
        var value = config.vars[key].replace(/@/, '$');
        console.log(varname + ' =\t\t\t', value + ';');
    });
}
