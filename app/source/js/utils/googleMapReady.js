/**
    It executes the given 'ready' function as parameter when
    map environment is ready (when google maps api and script is
    loaded and ready to use, or inmediately if is already loaded).

    IMPORTANT: Because how Google Loader works, and to support several
    uses of the API, some libraries where added to the URL parameters
    to be loaded. This comes from a limitation of Google loader, that doesn't
    allows to load the core Maps and later other needed libraries, since a
    different call to "load('maps',..)" will get discarded (even if we remove
    our isReady flag). It's weird to hardcode the libraries for any use,
    and make this less generic, but much needed.
**/
/*global google*/
var loader = require('./loader');

// Private static collection of callbacks registered
var stack = [];

var googleMapReady = module.exports = function googleMapReady(ready) {
    stack.push(ready);

    if (googleMapReady.isReady)
        ready(google);
    else if (!googleMapReady.isLoading) {
        googleMapReady.isLoading = true;
        loader.load({
            scripts: ['https://www.google.com/jsapi'],
            completeVerification: function () { return !!window.google; },
            complete: function () {
                google.load('maps', '3.26',
                    { other_params: 'libraries=places', callback: function () {
                        googleMapReady.isReady = true;
                        googleMapReady.isLoading = false;

                        for (var i = 0; i < stack.length; i++)
                            try {
                                stack[i](google);
                            } catch (e) { }
                    }
                });
            }
        });
    }
};

// Utility to force the refresh of maps that solve the problem with bad-sized map area
googleMapReady.refreshMap = function refreshMaps(map) {
    googleMapReady(function () {
        // Don't forget the center!
        var center = map.getCenter();
        google.maps.event.addListenerOnce(map, 'resize', function () {
            // Restore center
            if (center)
                map.setCenter(center);
        });
        google.maps.event.trigger(map, 'resize');
    });
};
