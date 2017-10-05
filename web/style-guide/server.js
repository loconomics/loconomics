/*jslint node: true, plusplus: true, vars: true*/
/*globals require, module, console */
var markdown = require( "markdown" ).markdown;

(function (exports) {
    'use strict';

    var http = require('http'),
        fs = require('fs'),
        handlebars = require('handlebars'),
        express = require('express'),
        baseTemplate = fs.readFileSync('./index.html', 'utf8'),
        app = express(),
        server;

    var pageBuilder = handlebars.compile(baseTemplate);
    var markupDirectory = './markup/';
    var docDirectory = './doc/';

    var readFilesIn = function(dirName) {
        var baseFileList = fs.readdirSync(markupDirectory + dirName + '/');
        return baseFileList.map(function(currentFile) {
            var currentDocumentationFile = currentFile.replace(/.html/i, '.md');
            return {
                title: currentFile.split('.', 1)[0],
                type: 'base',
                fileName: currentFile,
                content: fs.readFileSync(markupDirectory + dirName + '/' + currentFile),
                documentation: fs.readFileSync(docDirectory + dirName + '/' + currentDocumentationFile)
            };
        });
    };

    // Index
    app.get('/', function (req, res) {

        var vm = {
            base: [],
            patterns: []
        };

        Object.keys(vm).forEach(function(dirName) {
            vm[dirName] = readFilesIn(dirName);
        });

        res.writeHead(200, {'Context-Type': 'text/html'});
        res.write(pageBuilder(vm));
        res.end();
    });

    // Static files
    app.use('/images', express.static('images'));
    app.use('/css', express.static('css'));
    app.use('/js', express.static('js'));
    app.use('/vendor', express.static('vendor'));
    app.use('/assets', express.static('../assets'));

    server = app.listen(parseInt(process.env.PORT, 10) || 8080, function () {
        var host = server.address().address,
            port = server.address().port;

        console.log('Server listening at http://%s:%s', host, port);
    });

}(module.exports));
