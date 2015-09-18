/**
    Layout update event
**/
var throttle = require('./throttle');
var $ = require('jquery');

exports.layoutUpdateEvent = 'resize webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
exports.throttle = 50;

exports.on = function on() {
    $(window).on(exports.layoutUpdateEvent, throttle(function(e) {
        var ev = $.Event('layoutUpdate');
        ev.sourceEvent = e;
        $(window).trigger(ev);
    }, exports.throttle));
};

exports.off = function off() {
    $(window).off(exports.layoutUpdateEvent);
};
