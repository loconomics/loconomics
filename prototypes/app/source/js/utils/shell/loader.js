/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var $ = require('jquery');

module.exports = {
    
    baseUrl: '/',
    
    load: function load(name) {
        return new Promise(function(resolve, reject) {
            var $act = this.findActivityElement(name);
            if ($act.length) {
                resolve($act);
            }
            else {
                $.ajax({
                    url: this.baseUrl + name + '.html',
                    cache: false
                    // We are loading the program and no loader screen in place,
                    // so any in between interaction will be problematic.
                    //async: false
                }).then(function(html) {
                    // http://stackoverflow.com/a/12848798
                    var body = '<div id="body-mock">' + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + '</div>';
                    var $h = $($.parseHTML(body));
                    //var $h = $($.parseHTML(html));
                    $act = this.findActivityElement(name, $h);
                    if ($act.length) {
                        $('body').append($act);
                        resolve($act);
                    }
                    else {
                        reject(Error('Activity not found in the source file.'));
                    }
                    
                }.bind(this), reject);
            }
        }.bind(this));
    }
};
