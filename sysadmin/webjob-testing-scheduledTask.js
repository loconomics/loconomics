/**
    Script to perform a call of the ScheduledTask URL
    for a specific channel.
    Was created to be used as an Azure Webjobs
**/
'use strict';

// Change depending on TLS: http or https
var request = require('http');

var req = request.get({
    host: 'testing.loconomics.com',
    path: '/ScheduledTask'
}, function(response) {
    // no need to do something with result.
    //var body = ''
    //response.on('data',function(d){ body += d })
    response.on('end', function(){
        console.log('Request End');
    });
});

req.end();
