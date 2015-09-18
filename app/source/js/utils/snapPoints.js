/**
    snapPoints.
    
    Allows to register for a jQuery element a series of
    scroll vertical positions (aka 'snap points') that
    will trigger a custom event (providing a name per snap point)
    that will be triggered then a scroll changes the
    current relative position with that point, being
    the relation 'before', 'after' or 'there'.
    Only triggers when there is a change (it remember previous registered
    state).
    
    The execution of each check on scrolling is throttle to avoid burst,
    being the precision of that throttle configurable throught the third
    parameter (in milliseconds). By default has a value that 'teorically'
    can enable reactions at 60fps.
    Can be completely disabled by passing 0 as precision, and the event
    will be triggered synchronously when scroll happens.
    
    TODO Allow horizontal points
**/

var $ = require('jquery'),
    throttle = require('iagosrl/throttle');

module.exports = function snapPoints($scrollerElement, points, precision) {
    //jshint maxcomplexity:8
    if (!points || !Object.keys(points).length) return;
    $scrollerElement = $scrollerElement || $(window);
    // 60fps precision by default
    precision = precision === 0 ? 0 : Math.abs(precision |0) || 16;
    
    var record = {};

    var checkScroll = function() {
        var top = $scrollerElement.scrollTop();
        Object.keys(points).forEach(function(point) {
            //jshint maxcomplexity:8
            point = point |0;
            var type;
            if (point === top) {
                if (record[point] !== 'there')
                    type = 'there';
            }
            else if (top > point) {
                if (record[point] !== 'after')
                    type = 'after';
            }
            else {
                if (record[point] !== 'before')
                    type = 'before';
            }
            if (type) {
                $scrollerElement.trigger(points[point], [type]);
                record[point] = type;
            }
        });
    };
    if (precision > 0)
        checkScroll = throttle(checkScroll , precision);

    $scrollerElement.scroll(checkScroll);
    // First time check
    checkScroll();
};
