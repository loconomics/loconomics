'use strict';

var Router = require('./utils/Router').Router,
    RouteMatcher = require('./utils/Router').RouteMatcher,
    Route = require('./utils/Router').Route;

var router = new Router();

router.add(new RouteMatcher([
        new Route('about')
    ]), require('./activities/about'));

router.add(new RouteMatcher([
        new Route('terms')
    ]), require('./activities/terms'));

router.add(new RouteMatcher([
        new Route('*default') // matches no other route
    ]), require('./activities/home'));

module.exports = router;
