// Just generates a valid Less file with the
// variables from the config.json file found in the
// current directory
'use strict';

exports.build = function() {
    var config = require('./config.json');

    if (config && config.vars) {       
        return Object.keys(config.vars).map(function(key) {
            return key + ':\t\t\t' + config.vars[key] + ';';
        }).join('\n');
    }
    return '';
};

if (require.main === module) {
    console.log('// Variables from config.json');
    console.log(exports.build());
}
