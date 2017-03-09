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

    Optionally, you can include defaults that will be included if the route matches.
    These defaults will be overwritten with any matched parameters by the same name:
      var r = Route('/my/pages/:page', { isMy: true });
      r.match('/my/pages/7'); // { page: 7, isMy: true }

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

    RouteMatcher also supports default parameter values included in the matched
    hash *only if there is a match*:
      var m = new RouteMatcher([
          new Route('/jobs/new', { isNew: true }),
          new Route('/jobs/:job')
      ], { job: -1 });

      m.match('/jobs/new') // { job: -1, isNew: true }
      m.match('/jobs/3') // { job: 3, isNew: false }
      m.match('/will-not-match'); // false
*/
var RouteParser = require('route-parser'),
    $ = require('jquery');

var Route = function(expression, defaults) {
    this.routeParser = new RouteParser(expression);
    this.defaults = defaults || {};
};

Route.prototype.match = function(url) {
    var match = this.routeParser.match(url);

    return match ? $.extend(this.defaults, match) : false;
};

var RouteMatcher = function(routes, defaults) {
    this.routes = routes;
    this.defaults = defaults || {};
};

RouteMatcher.prototype.match = function(url) {
    var firstMatch = false;

    this.routes.some(function(route) {
        var m = route.match(url);
        if (m) {
            firstMatch = m;
            return true;
        }
    });

    return firstMatch ? $.extend(this.defaults, firstMatch) : false;
};

module.exports = { RouteMatcher : RouteMatcher, Route : Route, RouteParser : RouteParser };
