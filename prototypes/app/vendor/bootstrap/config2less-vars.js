// Just generates a valid Less file with the
// variables from the config.json file found in the
// current directory
'use strict';

var config = require('./config.json');

if (config && config.vars) {
    
    console.log('// Variables from config.json');
    
    Object.keys(config.vars).forEach(function(key) {
        console.log(key + ':\t\t\t', config.vars[key] + ';');
    });
}
