/**
    Read a page's GET URL variables and return them as an associative array.
    Additional property rawOriginalQuery provides the query string like
    in location.search.
**/
'user strict';
//global window

module.exports = function getUrlQuery(url) {

    url = url || window.location.href;

    var vars = [];
    var hash = null;
    var queryIndex = url.indexOf('?');
    var queryContent = '';
    if (queryIndex > -1) {
        queryContent = url.slice(queryIndex + 1);
        var hashes = queryContent.split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = decodeURIComponent(hash[1]);
        }
    }
    // Provides access to original query as string including question
    // mark or empty if no query
    vars.rawOriginalQuery = queryContent ? '?' + queryContent : '';
    return vars;
};
