;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');

exports.init = function initCalendar($activity) {

    var cal = $activity.find('#monthlyCalendar');
    cal.show().datepicker();

    var dayCal = $activity.find('#dayCalendar');

    var dateTitle = $activity.find('#dateTitle');

    cal
    .on('swipeleft', function() {
        cal.datepicker('moveDate', 'next');
    })
    .on('swiperight', function() {
        cal.datepicker('moveDate', 'prev');
    });

    cal.on('changeDate', function(e) {
    
        if (e.viewMode === 'days') {
            var date = moment(e.date);
            var dateInfo = dateTitle.children('time:eq(0)');
            dateInfo.attr('datetime', date.toISOString());
            dateInfo.text(date.format('LL'));
            cal.removeClass('is-visible');
        }
    });

    dayCal
    .on('swipeleft', function() {
        var d = cal.datepicker('getValue');
        console.log('left', d);
        d.setDate(d.getDate() + 1);

        cal.datepicker('setValue', d);
        console.log('left', d);
    })
    .on('swiperight', function() {
        cal.datepicker('moveDate', 'prev').hide();
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDYWxlbmRhcigkYWN0aXZpdHkpIHtcclxuXHJcbiAgICB2YXIgY2FsID0gJGFjdGl2aXR5LmZpbmQoJyNtb250aGx5Q2FsZW5kYXInKTtcclxuICAgIGNhbC5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG5cclxuICAgIHZhciBkYXlDYWwgPSAkYWN0aXZpdHkuZmluZCgnI2RheUNhbGVuZGFyJyk7XHJcblxyXG4gICAgdmFyIGRhdGVUaXRsZSA9ICRhY3Rpdml0eS5maW5kKCcjZGF0ZVRpdGxlJyk7XHJcblxyXG4gICAgY2FsXHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlRGF0ZScsICduZXh0Jyk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVEYXRlJywgJ3ByZXYnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNhbC5vbignY2hhbmdlRGF0ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGUgPSBtb21lbnQoZS5kYXRlKTtcclxuICAgICAgICAgICAgdmFyIGRhdGVJbmZvID0gZGF0ZVRpdGxlLmNoaWxkcmVuKCd0aW1lOmVxKDApJyk7XHJcbiAgICAgICAgICAgIGRhdGVJbmZvLmF0dHIoJ2RhdGV0aW1lJywgZGF0ZS50b0lTT1N0cmluZygpKTtcclxuICAgICAgICAgICAgZGF0ZUluZm8udGV4dChkYXRlLmZvcm1hdCgnTEwnKSk7XHJcbiAgICAgICAgICAgIGNhbC5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGRheUNhbFxyXG4gICAgLm9uKCdzd2lwZWxlZnQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZCA9IGNhbC5kYXRlcGlja2VyKCdnZXRWYWx1ZScpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdsZWZ0JywgZCk7XHJcbiAgICAgICAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgMSk7XHJcblxyXG4gICAgICAgIGNhbC5kYXRlcGlja2VyKCdzZXRWYWx1ZScsIGQpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdsZWZ0JywgZCk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsLmRhdGVwaWNrZXIoJ21vdmVEYXRlJywgJ3ByZXYnKS5oaWRlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkYXRlVGl0bGUub24oJ3RhcCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwLWRhdGVwaWNrZXInKTtcclxuXHJcbi8qKiBMb2FkIGFjdGl2aXRpZXMgKiovXHJcbnZhciBhY3Rpdml0aWVzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJylcclxufTtcclxuXHJcbi8qKiBQYWdlIHJlYWR5ICoqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gRGV0ZWN0IGFjdGl2aXRpZXMgbG9hZGVkIGluIHRoZSBjdXJyZW50IGRvY3VtZW50XHJcbiAgICAvLyBhbmQgaW5pdGlhbGl6ZSB0aGVtOlxyXG4gICAgJCgnW2RhdGEtYWN0aXZpdHldJykuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGFjdGl2aXR5ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3Rpdml0eS5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIGlmIChhY3Rpdml0aWVzLmhhc093blByb3BlcnR5KGFjdE5hbWUpKSB7XHJcbiAgICAgICAgICAgIGFjdGl2aXRpZXNbYWN0TmFtZV0uaW5pdCgkYWN0aXZpdHkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuIl19
;