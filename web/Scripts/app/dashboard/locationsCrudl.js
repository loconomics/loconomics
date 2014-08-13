/** Locations page setup for CRUDL use
**/
var $ = require('jquery');
var mapReady = require('LC/googleMapReady');
// Indirectly used: require('LC/hasConfirmSupport');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
    var $c = $(containerSelector),
    locationsSelector = '.DashboardLocations',
    $locations = $c.find(locationsSelector).closest('.DashboardSection-page-section'),
    $others = 
    $locations.siblings()
    .add($locations.find('.DashboardSection-page-section-introduction'))
    .add($locations.closest('.DashboardYourWork').siblings());

    var crudl = initCrudl(locationsSelector);

    var locationMap;

    crudl.elements
    .on(crudl.settings.events['edit-starts'], function () {
        $others.xhide({ effect: 'height', duration: 'slow' });
    })
    .on(crudl.settings.events['edit-ends'], function () {
        $others.xshow({ effect: 'height', duration: 'slow' });
    })
    .on(crudl.settings.events['editor-ready'], function (e, $editor) {
        //Force execution of the 'has-confirm' script
        $editor.find('fieldset.has-confirm > .confirm input').change();

        setupCopyLocation($editor);

        // Initialize first time only (no map still)
        if (!locationMap)
            locationMap = setupGeopositioning($editor);
    })
    .on(crudl.settings.events['editor-showed'], function (e, $editor) {
        if (locationMap)
            mapReady.refreshMap(locationMap);
    });
};

function setupCopyLocation($editor) {
    $editor.find('select.copy-location').change(function () {
        var $t = $(this);
        $t.closest('.crudl-form').reload(function () {
            return (
                $(this).data('ajax-fieldset-action').replace(
                    /LocationID=\d+/gi,
                    'LocationID=' + $t.val()) + '&' + $t.data('extra-query')
            );
        });
    });
}

/** Locate user position or translate address text into a geocode using
  browser and Google Maps services.
**/
function setupGeopositioning($editor) {
    var map;
    mapReady(function () {

        // Register if user selects or writes a position (to not overwrite it with automatic positioning)
        var positionedByUser = false;
        // Some confs
        var detailedZoomLevel = 17;
        var generalZoomLevel = 9;
        var foundLocations = {
            byUser: null,
            byGeolocation: null,
            byGeocode: null,
            original: null
        };

        var l = $editor.find('.location-map');
        var m = l.find('.map-selector > .google-map').get(0);
        var $lat = l.find('[name=latitude]');
        var $lng = l.find('[name=longitude]');
        var $isRadius = $editor.find('[name=itravel]');
        var $radius = $editor.find('[name=travel-radius]');

        // Creating position coordinates
        var myLatlng;
        (function () {
            var _lat_value = $lat.val(), _lng_value = $lng.val();
            if (_lat_value && _lng_value) {
                myLatlng = new google.maps.LatLng($lat.val(), $lng.val());
                // We consider as 'positioned by user' when there was a saved value for the position coordinates (we are editing a location)
                positionedByUser = (myLatlng.lat() !== 0 && myLatlng.lng() !== 0);
            } else {
                // Default position when there are not one (San Francisco just now):
                myLatlng = new google.maps.LatLng(37.75334439226298, -122.4254606035156);
            }
        })();
        // Remember original form location
        foundLocations.original = foundLocations.confirmed = myLatlng;

        // Create map
        var mapOptions = {
            zoom: (positionedByUser ? detailedZoomLevel : generalZoomLevel), // Best detail when we already had a location
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(m, mapOptions);

        // Create the position marker
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP
        });
        // Placeholder for the radiusCircle, created on demand
        var radiusCircle;
        // Initializing radiusCircle
        updateRadiusCircle();

        // Listen when user clicks map or move the marker to move marker or set position in the form
        google.maps.event.addListener(marker, 'dragend', function (event) {
            setFormCoordinates(marker.getPosition());
            updateRadiusCircle();
        });
        google.maps.event.addListener(map, 'click', function (event) {
            if (!marker.getDraggable()) return;
            placeMarker(event.latLng);
            positionedByUser = true;
            foundLocations.byUser = event.latLng;
            setFormCoordinates(event.latLng);
            updateRadiusCircle();
        });
        function placeMarker(latlng, dozoom, autosave) {
            marker.setPosition(latlng);
            // Move map
            map.panTo(latlng);
            saveCoordinates(autosave);
            updateRadiusCircle();

            if (dozoom)
            // Set zoom to something more detailed
                map.setZoom(detailedZoomLevel);
            return marker;
        }
        function saveCoordinates(inForm) {
            var latLng = marker.getPosition();
            positionedByUser = true;
            foundLocations.byUser = latLng;
            if (inForm === true) {
                setFormCoordinates(latLng);
            }
        }
        function setFormCoordinates(latLng) {
            $lat.val(latLng.lat()); //marker.position.Xa
            $lng.val(latLng.lng()); //marker.position.Ya
        }

        /**
        It creates a circle on the map with the given values
        **/
        function createRadiusCircle(latlng, radius) {

            return new google.maps.Circle({
                center: latlng,
                map: map,
                clickable: false,
                radius: getLocationRadius(),
                fillColor: '#00989A',
                fillOpacity: 0.3,
                strokeWeight: 0
            });
        }
        /**
        Updates the position and radius of current radiusCircle
        in the map for the current position and radius
        or the given one.
        If the circle doesn't exists, its created,
        or hidden if there is no radius and exists already.
        **/
        function updateRadiusCircle(latlng, radius) {

            latlng = latlng && latlng.getLng || marker.getPosition();
            radius = radius || getLocationRadius();

            if (radius && latlng) {
                if (radiusCircle) {
                    radiusCircle.setCenter(latlng);
                    radiusCircle.setRadius(radius);
                    radiusCircle.setVisible(true);
                }
                else {
                    radiusCircle = createRadiusCircle(latlng, radius);
                }
            } else if (radiusCircle) {
                radiusCircle.setVisible(false);
            }
        }
        /**
        Get the service radius as a number in meters usefule for Google Maps
        from the form whenever apply, else it returns null.
        **/
        function getLocationRadius() {

            // When radius/travel option choosen
            if ($isRadius.filter(':checked').prop('checked')) {
                // Get radius from form (its in miles or km)
                var radius = $radius.val();
                var radiusUnit = LC.distanceUnits[LC.getCurrentCulture().country];
                // result must go in meters
                return (radiusUnit == 'miles' ? convertMilesKm(radius, radiusUnit) : radius) * 1000;
            }

            return null;
        }

        // Listen when user changes form coordinates values to update the map
        $lat.change(updateMapMarker);
        $lng.change(updateMapMarker);
        function updateMapMarker() {
            positionedByUser = true;
            var newPos = new google.maps.LatLng($lat.val(), $lng.val());
            // Move marker
            marker.setPosition(newPos);
            // Move map
            map.panTo(newPos);
            updateRadiusCircle();
        }
        // Listen when user changes service radius from form to update the map
        $isRadius.change(updateRadiusCircle);
        $radius.change(updateRadiusCircle);

        /*===================
        * AUTO POSITIONING
        */
        function useGeolocation(force, autosave) {
            var override = force || !positionedByUser;
            // Use browser geolocation support to get an automatic location if there is no a location selected by user
            // Check to see if this browser supports geolocation.
            if (override && navigator.geolocation) {

                // This is the location marker that we will be using
                // on the map. Let's store a reference to it here so
                // that it can be updated in several places.
                var locationMarker = null;

                // Get the location of the user's browser using the
                // native geolocation service. When we invoke this method
                // only the first callback is requied. The second
                // callback - the error handler - and the third
                // argument - our configuration options - are optional.
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        // Check to see if there is already a location.
                        // There is a bug in FireFox where this gets
                        // invoked more than once with a cached result.
                        if (locationMarker) {
                            return;
                        }

                        // Move marker to the map using the position, only if user doesn't set a position
                        if (override) {
                            var latLng = new google.maps.LatLng(
                                position.coords.latitude,
                                position.coords.longitude
                            );
                            locationMarker = placeMarker(latLng, true, autosave);
                            foundLocations.byGeolocation = latLng;
                        }
                    },
                    function (error) {
                        if (console && console.log) console.log("Something went wrong: ", error);
                    },
                    {
                        timeout: (5 * 1000),
                        maximumAge: (1000 * 60 * 15),
                        enableHighAccuracy: true
                    }
                );


                // Now that we have asked for the position of the user,
                // let's watch the position to see if it updates. This
                // can happen if the user physically moves, of if more
                // accurate location information has been found (ex.
                // GPS vs. IP address).
                //
                // NOTE: This acts much like the native setInterval(),
                // invoking the given callback a number of times to
                // monitor the position. As such, it returns a "timer ID"
                // that can be used to later stop the monitoring.
                var positionTimer = navigator.geolocation.watchPosition(
                  function (position) {
                      // Move again to the new or accurated position, if user doesn't set a position
                      if (override) {
                          var latLng = new google.maps.LatLng(
                              position.coords.latitude,
                              position.coords.longitude
                          );
                          locationMarker = placeMarker(latLng, true, autosave);
                          foundLocations.byGeolocation = latLng;
                      } else
                          navigator.geolocation.clearWatch(positionTimer);
                  }
              );

                // If the position hasn't updated within 5 minutes, stop
                // monitoring the position for changes.
                setTimeout(
                  function () {
                      // Clear the position watcher.
                      navigator.geolocation.clearWatch(positionTimer);
                  },
                  (1000 * 60 * 5)
              );
            } // Ends geolocation position
        }
        function useGmapsGeocode(initialLookup, autosave) {
            var geocoder = new google.maps.Geocoder();

            // lookup on address fields changes with complete information
            var $form = $editor.find('.crudl-form'), form = $form.get(0);
            function getFormAddress() {
                var ad = [];
                function add(field) {
                    if (form.elements[field] && form.elements[field].value) ad.push(form.elements[field].value);
                }
                add('addressline1');
                add('addressline2');
                add('city');
                add('postalcode');
                var s = form.elements.state;
                if (s && s.value) ad.push(s.options[s.selectedIndex].label);
                ad.push('USA');
                // Minimum for valid address: 2 fields filled out
                return ad.length >= 2 ? ad.join(', ') : null;
            }
            $form.on('change', '[name=addressline1], [name=addressline2], [name=city], [name=postalcode], [name=state]', function () {
                var address = getFormAddress();
                if (address)
                    geocodeLookup(address, false);
            });

            // Initial lookup
            if (initialLookup) {
                var address = getFormAddress();
                if (address)
                    geocodeLookup(address, true);
            }

            function geocodeLookup(address, override) {
                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var latLng = results[0].geometry.location;
                        //console.info('Geocode retrieved: ' + latLng + ' for address "' + address + '"');
                        foundLocations.byGeocode = latLng;

                        placeMarker(latLng, true, autosave);
                    } else {
                        if (console && console.error) console.error('Geocode was not successful for the following reason: ' + status + ' on address "' + address + '"');
                    }
                });
            }
        }

        // Executing auto positioning (changed to autosave:true to all time save the location):
        //useGeolocation(true, false);
        useGmapsGeocode(false, true);

        // Link options links:
        l.find('.options a').off('click.map').on('click.map', function () {
            var target = $(this).attr('href').substr(1);
            switch (target) {
                case 'geolocation':
                    if (foundLocations.byGeolocation)
                        placeMarker(foundLocations.byGeolocation, true, true);
                    else
                        useGeolocation(true, true);
                    break;
                case 'geocode':
                    if (foundLocations.byGeocode)
                        placeMarker(foundLocations.byGeocode, true, true);
                    else
                        useGmapsGeocode(true, true);
                    break;
                case 'confirm':
                    saveCoordinates(true);
                    marker.setDraggable(false);
                    foundLocations.confirmed = marker.getPosition();
                    l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode').hide('fast');
                    var edit = l.find('.edit-action');
                    edit.text(edit.data('edit-label'));
                    break;
                case 'editcoordinates':
                    var a = l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode');
                    var b = !a.is(':visible');
                    marker.setDraggable(b);
                    var $t = $(this);
                    if (b) {
                        $t.data('edit-label', $t.text());
                        $t.text($t.data('cancel-label'));
                    } else {
                        $t.text($t.data('edit-label'));
                        // Restore location:
                        placeMarker(foundLocations.confirmed, true, true);
                    }
                    a.toggle('fast');
                    break;
            }

            return false;
        });
    });

    return map;
}