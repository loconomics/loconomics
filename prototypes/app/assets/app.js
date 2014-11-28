;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');

exports.init = function initCalendar($activity) {

    var cal = $activity.find('#monthlyCalendar');
    cal.show().datepicker();

    var dayCal = $activity.find('#dayCalendar');

    var $calendarDateHeader = $activity.find('.CalendarDateHeader');
    var dateTitle = $calendarDateHeader.children('.CalendarDateHeader-date');

    cal
    .on('swipeleft', function() {
        cal.datepicker('moveDate', 'next');
    })
    .on('swiperight', function() {
        cal.datepicker('moveDate', 'prev');
    });
    
    var updateDateTitle = function updateDateTitle(date) {
        date = moment(date);
        var dateInfo = dateTitle.children('time:eq(0)');
        dateInfo.attr('datetime', date.toISOString());
        dateInfo.text(date.format('dddd (M/D)'));
        cal.removeClass('is-visible');
    };

    cal.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            updateDateTitle(e.date);
        }
    });
    // First date:
    updateDateTitle(cal.datepicker('getValue'));

    dayCal
    .on('swipeleft', function() {
        cal.datepicker('moveValue', 'next', 'date');
    })
    .on('swiperight', function() {
        cal.datepicker('moveValue', 'prev', 'date');
    });
    
    $calendarDateHeader.on('tap', '.CalendarDateHeader-switch', function(e) {
        switch (this.getAttribute('href')) {
            case '#prev':
                cal.datepicker('moveValue', 'prev', 'date');
                break;
            case '#next':
                cal.datepicker('moveValue', 'next', 'date');
                break;
            default:
                // Lets default:
                return;
        }
        e.preventDefault();
        e.stopPropagation();
    });

    dateTitle.on('tap', function() {
        cal.toggleClass('is-visible');
    });
};

},{"moment":false}],2:[function(require,module,exports){
'use strict';

var $ = require('jquery');
require('jquery-mobile');
require('bootstrap-datepicker');

/** Load activities **/
var activities = {
    'calendar': require('./activities/calendar')
};

/** Page ready **/
$(function() {
    // Detect activities loaded in the current document
    // and initialize them:
    $('[data-activity]').each(function() {
        var $activity = $(this);
        var actName = $activity.data('activity');
        if (activities.hasOwnProperty(actName)) {
            activities[actName].init($activity);
        }
    });
});

},{"./activities/calendar":1}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2FsZW5kYXIoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgdmFyIGNhbCA9ICRhY3Rpdml0eS5maW5kKCcjbW9udGhseUNhbGVuZGFyJyk7XHJcbiAgICBjYWwuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICB2YXIgZGF5Q2FsID0gJGFjdGl2aXR5LmZpbmQoJyNkYXlDYWxlbmRhcicpO1xyXG5cclxuICAgIHZhciAkY2FsZW5kYXJEYXRlSGVhZGVyID0gJGFjdGl2aXR5LmZpbmQoJy5DYWxlbmRhckRhdGVIZWFkZXInKTtcclxuICAgIHZhciBkYXRlVGl0bGUgPSAkY2FsZW5kYXJEYXRlSGVhZGVyLmNoaWxkcmVuKCcuQ2FsZW5kYXJEYXRlSGVhZGVyLWRhdGUnKTtcclxuXHJcbiAgICBjYWxcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVEYXRlJywgJ25leHQnKTtcclxuICAgIH0pXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZURhdGUnLCAncHJldicpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciB1cGRhdGVEYXRlVGl0bGUgPSBmdW5jdGlvbiB1cGRhdGVEYXRlVGl0bGUoZGF0ZSkge1xyXG4gICAgICAgIGRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcbiAgICAgICAgdmFyIGRhdGVJbmZvID0gZGF0ZVRpdGxlLmNoaWxkcmVuKCd0aW1lOmVxKDApJyk7XHJcbiAgICAgICAgZGF0ZUluZm8uYXR0cignZGF0ZXRpbWUnLCBkYXRlLnRvSVNPU3RyaW5nKCkpO1xyXG4gICAgICAgIGRhdGVJbmZvLnRleHQoZGF0ZS5mb3JtYXQoJ2RkZGQgKE0vRCknKSk7XHJcbiAgICAgICAgY2FsLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNhbC5vbignY2hhbmdlRGF0ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgIHVwZGF0ZURhdGVUaXRsZShlLmRhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gRmlyc3QgZGF0ZTpcclxuICAgIHVwZGF0ZURhdGVUaXRsZShjYWwuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKSk7XHJcblxyXG4gICAgZGF5Q2FsXHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsICdwcmV2JywgJ2RhdGUnKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAkY2FsZW5kYXJEYXRlSGVhZGVyLm9uKCd0YXAnLCAnLkNhbGVuZGFyRGF0ZUhlYWRlci1zd2l0Y2gnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJyNwcmV2JzpcclxuICAgICAgICAgICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsICduZXh0JywgJ2RhdGUnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgLy8gTGV0cyBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGRhdGVUaXRsZS5vbigndGFwJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLnRvZ2dsZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LW1vYmlsZScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAtZGF0ZXBpY2tlcicpO1xyXG5cclxuLyoqIExvYWQgYWN0aXZpdGllcyAqKi9cclxudmFyIGFjdGl2aXRpZXMgPSB7XHJcbiAgICAnY2FsZW5kYXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2FsZW5kYXInKVxyXG59O1xyXG5cclxuLyoqIFBhZ2UgcmVhZHkgKiovXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBEZXRlY3QgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIGN1cnJlbnQgZG9jdW1lbnRcclxuICAgIC8vIGFuZCBpbml0aWFsaXplIHRoZW06XHJcbiAgICAkKCdbZGF0YS1hY3Rpdml0eV0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkYWN0aXZpdHkgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdGl2aXR5LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgaWYgKGFjdGl2aXRpZXMuaGFzT3duUHJvcGVydHkoYWN0TmFtZSkpIHtcclxuICAgICAgICAgICAgYWN0aXZpdGllc1thY3ROYW1lXS5pbml0KCRhY3Rpdml0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG4iXX0=
;