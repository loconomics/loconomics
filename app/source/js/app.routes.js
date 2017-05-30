'use strict';

var Router = require('./utils/Router').Router,
    RouteMatcher = require('./utils/Router').RouteMatcher,
    Route = require('./utils/Router').Route;

var router = new Router();

router.add(new RouteMatcher([
        new Route('about')
    ]), require('./activities/about').klass);

router.add(new RouteMatcher([
        new Route('terms')
    ]), require('./activities/terms').klass);

router.add(new RouteMatcher([
        new Route('*default')
    ]), require('./activities/home').klass);

module.exports = router;
