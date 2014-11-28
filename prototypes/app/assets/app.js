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
        dateInfo.text(date.format('LL'));
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2FsZW5kYXIoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgdmFyIGNhbCA9ICRhY3Rpdml0eS5maW5kKCcjbW9udGhseUNhbGVuZGFyJyk7XHJcbiAgICBjYWwuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICB2YXIgZGF5Q2FsID0gJGFjdGl2aXR5LmZpbmQoJyNkYXlDYWxlbmRhcicpO1xyXG5cclxuICAgIHZhciAkY2FsZW5kYXJEYXRlSGVhZGVyID0gJGFjdGl2aXR5LmZpbmQoJy5DYWxlbmRhckRhdGVIZWFkZXInKTtcclxuICAgIHZhciBkYXRlVGl0bGUgPSAkY2FsZW5kYXJEYXRlSGVhZGVyLmNoaWxkcmVuKCcuQ2FsZW5kYXJEYXRlSGVhZGVyLWRhdGUnKTtcclxuXHJcbiAgICBjYWxcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVEYXRlJywgJ25leHQnKTtcclxuICAgIH0pXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZURhdGUnLCAncHJldicpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciB1cGRhdGVEYXRlVGl0bGUgPSBmdW5jdGlvbiB1cGRhdGVEYXRlVGl0bGUoZGF0ZSkge1xyXG4gICAgICAgIGRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcbiAgICAgICAgdmFyIGRhdGVJbmZvID0gZGF0ZVRpdGxlLmNoaWxkcmVuKCd0aW1lOmVxKDApJyk7XHJcbiAgICAgICAgZGF0ZUluZm8uYXR0cignZGF0ZXRpbWUnLCBkYXRlLnRvSVNPU3RyaW5nKCkpO1xyXG4gICAgICAgIGRhdGVJbmZvLnRleHQoZGF0ZS5mb3JtYXQoJ0xMJykpO1xyXG4gICAgICAgIGNhbC5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgfTtcclxuXHJcbiAgICBjYWwub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICB1cGRhdGVEYXRlVGl0bGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIEZpcnN0IGRhdGU6XHJcbiAgICB1cGRhdGVEYXRlVGl0bGUoY2FsLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykpO1xyXG5cclxuICAgIGRheUNhbFxyXG4gICAgLm9uKCdzd2lwZWxlZnQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ25leHQnLCAnZGF0ZScpO1xyXG4gICAgfSlcclxuICAgIC5vbignc3dpcGVyaWdodCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgJGNhbGVuZGFyRGF0ZUhlYWRlci5vbigndGFwJywgJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSkge1xyXG4gICAgICAgICAgICBjYXNlICcjcHJldic6XHJcbiAgICAgICAgICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ3ByZXYnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJyNuZXh0JzpcclxuICAgICAgICAgICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkYXRlVGl0bGUub24oJ3RhcCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwLWRhdGVwaWNrZXInKTtcclxuXHJcbi8qKiBMb2FkIGFjdGl2aXRpZXMgKiovXHJcbnZhciBhY3Rpdml0aWVzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJylcclxufTtcclxuXHJcbi8qKiBQYWdlIHJlYWR5ICoqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gRGV0ZWN0IGFjdGl2aXRpZXMgbG9hZGVkIGluIHRoZSBjdXJyZW50IGRvY3VtZW50XHJcbiAgICAvLyBhbmQgaW5pdGlhbGl6ZSB0aGVtOlxyXG4gICAgJCgnW2RhdGEtYWN0aXZpdHldJykuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGFjdGl2aXR5ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3Rpdml0eS5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIGlmIChhY3Rpdml0aWVzLmhhc093blByb3BlcnR5KGFjdE5hbWUpKSB7XHJcbiAgICAgICAgICAgIGFjdGl2aXRpZXNbYWN0TmFtZV0uaW5pdCgkYWN0aXZpdHkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuIl19
;