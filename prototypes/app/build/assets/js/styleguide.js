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
require('bootstrap');

jQuery(function ($) {

    var HelpPoint = require('../LC/HelpPoint').HelpPoint;
    HelpPoint.enableAll(document);

});

},{"../LC/HelpPoint":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6XFxJYWdvXFxQcm94ZWN0b3NcXExvY29ub21pY3MuY29tXFxzb3VyY2VcXHdlYlxcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9IZWxwUG9pbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3N0eWxlZ3VpZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qZ2xvYmFsIGRvY3VtZW50Ki9cclxuLyoqXHJcbiAgICBIZWxwUG9pbnQgUG9wb3ZlciAjNTU5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuXHJcbmZ1bmN0aW9uIEhlbHBQb2ludChlbGVtZW50KSB7XHJcblxyXG4gICAgdmFyICRlbCA9ICQoZWxlbWVudCk7XHJcblxyXG4gICAgJGVsXHJcbiAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgY29udGFpbmVyOiAnYm9keSdcclxuICAgIH0pXHJcbiAgICAuZmlsdGVyKCdhW2hyZWY9XCIjXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAvLyBBdm9pZCBuYXZpZ2F0ZSB0byB0aGUgbGluaywgd2hlbiBpbXBsZW1lbnRlZFxyXG4gICAgICAgIC8vIGxpa2UgYW4gaW50ZXJuYWwgbGluayB3aXRoIG5vdGhpbmdcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gJGVsO1xyXG59XHJcblxyXG5leHBvcnRzLkhlbHBQb2ludCA9IEhlbHBQb2ludDtcclxuXHJcbkhlbHBQb2ludC5lbmFibGVBbGwgPSBmdW5jdGlvbiBlbmFibGVBbGwoaW5Db250YWluZXIpIHtcclxuXHJcbiAgICAkKGluQ29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuSGVscFBvaW50JykudG9BcnJheSgpLmZvckVhY2goSGVscFBvaW50KTtcclxufTtcclxuIiwiLyoqXHJcblNjcmlwdHMgdGhhdCBmdWxsZmlsbCB0aGUgaW4tZGV2ZWxvcG1lbnQgU3R5bGUgR3VpZGUgKG1vcmUgb24gIzc1NykuXHJcblRoZSByZXN1bHQgaXMgdXNlZCBkaXJlY3RseSBieSB0aGUgc3R5bGVndWlkZSBzaXRlIHRvIHByb3ZpZGUgdGhlIGN1c3RvbVxyXG5jb21wb25lbnRzIGJ1aWx0IG9uIHRvcCBvZiBCb290c3RyYXAgb3Igc2lkZSBieSBzaWRlLlxyXG4qKi9cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuXHJcbmpRdWVyeShmdW5jdGlvbiAoJCkge1xyXG5cclxuICAgIHZhciBIZWxwUG9pbnQgPSByZXF1aXJlKCcuLi9MQy9IZWxwUG9pbnQnKS5IZWxwUG9pbnQ7XHJcbiAgICBIZWxwUG9pbnQuZW5hYmxlQWxsKGRvY3VtZW50KTtcclxuXHJcbn0pO1xyXG4iXX0=
