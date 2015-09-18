
'use strict';

exports.build = function() {
    
    // Catch up console.log output (less2stylus sends there the result :-( )
    var sourceConsoleLog = console.log;

    var log = [];
    console.log = function() {
        log.push([].slice.call(arguments));
    };

    // Convert config.json to less
    var config2less = require('./config2less-vars'),
        fs = require('fs');

    var lessContent = config2less.build();
    
    // Convert less content to stylus (output goes to our console log)
    convert(lessContent);
    // Join log as usually done by console.log into a memory string:
    var stylContent = log.join('\n');

    // Re-enable standard console.log:
    console.log = sourceConsoleLog;

    //console.log('STYL', stylContent);
    
    // Save less and styl contents to files
    fs.writeFileSync(__dirname + '/less/variables.less', lessContent);
    fs.writeFileSync(__dirname + '/styl/variables.styl', stylContent);
};

function convert(content) {
    
    var less = require('less2stylus/node_modules/less'),
        less2stylus = require('less2stylus');
    
    var filename, parser, str;

    parser = new less.Parser({
        filename: 'variables.less'
    });

    parser.parse(content, function(err, node) {
        if (err) {
            throw err;
        }
        less2stylus.renderPrelude() + less2stylus.renderTree(node);
    });
}

if (require.main === module) {
    exports.build();
    console.log('DONE!');
}
