/*jslint node: true, plusplus: true, vars: true*/
/*globals require, module, console */
(function (exports) {
    'use strict';

    var http = require('http'),
        fs = require('fs'),
        handlebars = require('handlebars'),
        express = require('express'),
        baseTemplate = fs.readFileSync('./index.html', 'utf8'),
        app = express(),
        server;

    // Index
    app.get('/', function (req, res) {
        var pageBuilder = handlebars.compile(baseTemplate),
            markupDirectory = './markup/',
            docDirectory = './doc/',
            baseFileList = fs.readdirSync(markupDirectory + 'base/'),
            patternFileList =  fs.readdirSync(markupDirectory + 'patterns/'),
            vm = {base: [], patterns: []},
            fileIndex;

        for (fileIndex = 0; fileIndex < baseFileList.length; fileIndex++) {
            var currentFile = baseFileList[fileIndex];
            var currentDocumentationFile = currentFile.replace(/.html/i, '.md');

            vm.base.push({
                title: currentFile.split('.', 1)[0],
                type: 'base',
                fileName: currentFile,
                content: fs.readFileSync(markupDirectory + 'base/' + currentFile),
                documentation: fs.readFileSync(docDirectory + 'base/' + currentDocumentationFile)
            });
        }

        for (fileIndex = 0; fileIndex < patternFileList.length; fileIndex++) {
            var currentFile = patternFileList[fileIndex];
            var currentDocumentationFile = currentFile.replace(/.html/i, '.md');

            vm.patterns.push({
                title: currentFile.split('.', 1)[0],
                type: 'patterns',
                fileName: currentFile,
                content: fs.readFileSync(markupDirectory + 'patterns/' + currentFile),
                documentation: fs.readFileSync(docDirectory + 'patterns/' + currentDocumentationFile)
            });
        }

        res.writeHead(200, {'Context-Type': 'text/html'});
        res.write(pageBuilder(vm));
        res.end();
    });

    // Static files
    app.use('/images', express.static('images'));
    app.use('/css', express.static('css'));
    app.use('/js', express.static('js'));

    server = app.listen(parseInt(process.env.PORT, 10) || 8080, function () {
        var host = server.address().address,
            port = server.address().port;

        console.log('Server listening at http://%s:%s', host, port);
    });

}(module.exports));
