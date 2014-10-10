(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global document*/
/**
    HelpPoint Popover #559
**/
var $ = require('jquery');
require('bootstrap');

function HelpPoint(element) {

    var $el = $(element);

    $el
    .popover({
        container: 'body'
    })
    .filter('a[href="#"]').on('click', function (e) {
        // Avoid navigate to the link, when implemented
        // like an internal link with nothing
        e.preventDefault();
    });

    return $el;
}

exports.HelpPoint = HelpPoint;

HelpPoint.enableAll = function enableAll(inContainer) {

    $(inContainer || document).find('.HelpPoint').toArray().forEach(HelpPoint);
};

},{}],2:[function(require,module,exports){
/**
Scripts that fullfill the in-development Style Guide (more on #757).
The result is used directly by the styleguide site to provide the custom
components built on top of Bootstrap or side by side.
**/
var jQuery = require('jquery');

jQuery(function ($) {

    var HelpPoint = require('../LC/HelpPoint').HelpPoint;
    HelpPoint.enableAll(document);

});

},{"../LC/HelpPoint":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvSGVscFBvaW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9zdHlsZWd1aWRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypnbG9iYWwgZG9jdW1lbnQqL1xyXG4vKipcclxuICAgIEhlbHBQb2ludCBQb3BvdmVyICM1NTlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG5cclxuZnVuY3Rpb24gSGVscFBvaW50KGVsZW1lbnQpIHtcclxuXHJcbiAgICB2YXIgJGVsID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAkZWxcclxuICAgIC5wb3BvdmVyKHtcclxuICAgICAgICBjb250YWluZXI6ICdib2R5J1xyXG4gICAgfSlcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rLCB3aGVuIGltcGxlbWVudGVkXHJcbiAgICAgICAgLy8gbGlrZSBhbiBpbnRlcm5hbCBsaW5rIHdpdGggbm90aGluZ1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiAkZWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuSGVscFBvaW50ID0gSGVscFBvaW50O1xyXG5cclxuSGVscFBvaW50LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIGVuYWJsZUFsbChpbkNvbnRhaW5lcikge1xyXG5cclxuICAgICQoaW5Db250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5IZWxwUG9pbnQnKS50b0FycmF5KCkuZm9yRWFjaChIZWxwUG9pbnQpO1xyXG59O1xyXG4iLCIvKipcclxuU2NyaXB0cyB0aGF0IGZ1bGxmaWxsIHRoZSBpbi1kZXZlbG9wbWVudCBTdHlsZSBHdWlkZSAobW9yZSBvbiAjNzU3KS5cclxuVGhlIHJlc3VsdCBpcyB1c2VkIGRpcmVjdGx5IGJ5IHRoZSBzdHlsZWd1aWRlIHNpdGUgdG8gcHJvdmlkZSB0aGUgY3VzdG9tXHJcbmNvbXBvbmVudHMgYnVpbHQgb24gdG9wIG9mIEJvb3RzdHJhcCBvciBzaWRlIGJ5IHNpZGUuXHJcbioqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5qUXVlcnkoZnVuY3Rpb24gKCQpIHtcclxuXHJcbiAgICB2YXIgSGVscFBvaW50ID0gcmVxdWlyZSgnLi4vTEMvSGVscFBvaW50JykuSGVscFBvaW50O1xyXG4gICAgSGVscFBvaW50LmVuYWJsZUFsbChkb2N1bWVudCk7XHJcblxyXG59KTtcclxuIl19
