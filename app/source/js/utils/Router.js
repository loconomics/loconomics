'use strict';

/*
    Router Tools

    Classes to match URLs and extra parameters based on regular expressions.

    Uses route-parser library: https://github.com/rcs/route-parser

    How to use:

    Route will match against a single URL and route expression. It will extract
    values from the URL that match against the expression. (See route-parser for
    expression syntax.)

    Example:
      var r = Route('/my/pages/:page');
      r.match('/my/pages/7'); // { page: 7 }
      r.match('/will-not-match'); // false

    Optionally, you can include constants that will be included if the route matches.
    These constants will overwrite any matched parameters by the same name:
      var r = Route('/my/pages/:page');
      r.match('/my/pages/7', { isMy: true }); // { page: 7, isMy: true }

    The constants are most helpful when using several Routes and RouteMatcher.

    RouteMatcher checks multiple routes and returns the parameter hash from the
    first route that matches a given URL, false if there are no matches.

    Example:
      var m = new RouteMatcher([
          new Route('/jobs/new', { isNew: true }),  // new route first since 'new' will match :job
          new Route('/jobs/:job')
      ]);

      m.match('/jobs/new'); // { isNew: true }
      m.match('/jobs/3'); // { job: 3 }
      m.match('/will-not-match'); // false

    RouteMatcher supports default parameter values included in the matched
    hash *only if there is a match*:
      m.match('/jobs/5', { isNew: false }); // { job: 5, isNew: false }
      m.match('/jobs/5', { job: 'a default' }); // { job: 5 }
      m.match('/will-not-match', { job: 'default' }); // false
*/
var RouteParser = require('route-parser'),
    $ = require('jquery');

var Route = function(expression, constants) {
    this.routeParser = new RouteParser(expression);
    this.constants = constants || {};
};

Route.prototype.match = function(url) {
    var match = this.routeParser.match(url);

    return match ? $.extend(match, this.constants) : match;
};

var RouteMatcher = function(routes) {
    this.routes = routes;
};

RouteMatcher.prototype.match = function(url, defaults) {
    // Future optimization: stop evaluating routes after first match
    var matches = this.routes.map(function(route) { return route.match(url); }),
        firstMatch = matches.find(function(match) { return !!match; });

    return firstMatch ? $.extend(defaults || {}, firstMatch) : firstMatch;
};

module.exports = { RouteMatcher : RouteMatcher, Route : Route, RouteParser : RouteParser };
