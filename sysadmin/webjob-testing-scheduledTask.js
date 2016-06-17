/**
    Script to perform a call of the ScheduledTask URL
    for a specific channel.
    Was created to be used as an Azure Webjobs
**/
'use strict';

var http = require('http');

http.get({
    host: 'loconomics.azurewebsites.net',
    path: '/testing/ScheduledTask'
}, function(response) {
    // no need to do something with result.
    //var body = ''
    //response.on('data',function(d){ body += d })
    //response.on('end', function(){..})
});
