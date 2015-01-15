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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxJYWdvXFxQcm94ZWN0b3NcXExvY29ub21pY3MuY29tXFxzb3VyY2VcXHdlYlxcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6L0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9IZWxwUG9pbnQuanMiLCJEOi9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3N0eWxlZ3VpZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmdsb2JhbCBkb2N1bWVudCovXHJcbi8qKlxyXG4gICAgSGVscFBvaW50IFBvcG92ZXIgIzU1OVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcblxyXG5mdW5jdGlvbiBIZWxwUG9pbnQoZWxlbWVudCkge1xyXG5cclxuICAgIHZhciAkZWwgPSAkKGVsZW1lbnQpO1xyXG5cclxuICAgICRlbFxyXG4gICAgLnBvcG92ZXIoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogJ2JvZHknXHJcbiAgICB9KVxyXG4gICAgLmZpbHRlcignYVtocmVmPVwiI1wiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgLy8gQXZvaWQgbmF2aWdhdGUgdG8gdGhlIGxpbmssIHdoZW4gaW1wbGVtZW50ZWRcclxuICAgICAgICAvLyBsaWtlIGFuIGludGVybmFsIGxpbmsgd2l0aCBub3RoaW5nXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuICRlbDtcclxufVxyXG5cclxuZXhwb3J0cy5IZWxwUG9pbnQgPSBIZWxwUG9pbnQ7XHJcblxyXG5IZWxwUG9pbnQuZW5hYmxlQWxsID0gZnVuY3Rpb24gZW5hYmxlQWxsKGluQ29udGFpbmVyKSB7XHJcblxyXG4gICAgJChpbkNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLkhlbHBQb2ludCcpLnRvQXJyYXkoKS5mb3JFYWNoKEhlbHBQb2ludCk7XHJcbn07XHJcbiIsIi8qKlxyXG5TY3JpcHRzIHRoYXQgZnVsbGZpbGwgdGhlIGluLWRldmVsb3BtZW50IFN0eWxlIEd1aWRlIChtb3JlIG9uICM3NTcpLlxyXG5UaGUgcmVzdWx0IGlzIHVzZWQgZGlyZWN0bHkgYnkgdGhlIHN0eWxlZ3VpZGUgc2l0ZSB0byBwcm92aWRlIHRoZSBjdXN0b21cclxuY29tcG9uZW50cyBidWlsdCBvbiB0b3Agb2YgQm9vdHN0cmFwIG9yIHNpZGUgYnkgc2lkZS5cclxuKiovXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmpRdWVyeShmdW5jdGlvbiAoJCkge1xyXG5cclxuICAgIHZhciBIZWxwUG9pbnQgPSByZXF1aXJlKCcuLi9MQy9IZWxwUG9pbnQnKS5IZWxwUG9pbnQ7XHJcbiAgICBIZWxwUG9pbnQuZW5hYmxlQWxsKGRvY3VtZW50KTtcclxuXHJcbn0pO1xyXG4iXX0=
