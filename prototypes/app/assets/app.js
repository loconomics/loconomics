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
        cal.datepicker('moveDate', 'next').hide();
    })
    .on('swiperight', function() {
        cal.datepicker('moveDate', 'prev');
    });

    cal.on('changeDate', function(e) {
    
        var date = moment(e.date);
        dateTitle.text(date.format('LL'));
        cal.removeClass('is-visible');
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYWN0aXZpdGllcy9jYWxlbmRhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2FsZW5kYXIoJGFjdGl2aXR5KSB7XHJcblxyXG4gICAgdmFyIGNhbCA9ICRhY3Rpdml0eS5maW5kKCcjbW9udGhseUNhbGVuZGFyJyk7XHJcbiAgICBjYWwuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICB2YXIgZGF5Q2FsID0gJGFjdGl2aXR5LmZpbmQoJyNkYXlDYWxlbmRhcicpO1xyXG5cclxuICAgIHZhciBkYXRlVGl0bGUgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGVUaXRsZScpO1xyXG5cclxuICAgIGNhbFxyXG4gICAgLm9uKCdzd2lwZWxlZnQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZURhdGUnLCAnbmV4dCcpLmhpZGUoKTtcclxuICAgIH0pXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignbW92ZURhdGUnLCAncHJldicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY2FsLm9uKCdjaGFuZ2VEYXRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgXHJcbiAgICAgICAgdmFyIGRhdGUgPSBtb21lbnQoZS5kYXRlKTtcclxuICAgICAgICBkYXRlVGl0bGUudGV4dChkYXRlLmZvcm1hdCgnTEwnKSk7XHJcbiAgICAgICAgY2FsLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkYXlDYWxcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGQgPSBjYWwuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnbGVmdCcsIGQpO1xyXG4gICAgICAgIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIDEpO1xyXG5cclxuICAgICAgICBjYWwuZGF0ZXBpY2tlcignc2V0VmFsdWUnLCBkKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnbGVmdCcsIGQpO1xyXG4gICAgfSlcclxuICAgIC5vbignc3dpcGVyaWdodCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbC5kYXRlcGlja2VyKCdtb3ZlRGF0ZScsICdwcmV2JykuaGlkZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZGF0ZVRpdGxlLm9uKCd0YXAnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjYWwudG9nZ2xlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktbW9iaWxlJyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcC1kYXRlcGlja2VyJyk7XHJcblxyXG4vKiogTG9hZCBhY3Rpdml0aWVzICoqL1xyXG52YXIgYWN0aXZpdGllcyA9IHtcclxuICAgICdjYWxlbmRhcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhcicpXHJcbn07XHJcblxyXG4vKiogUGFnZSByZWFkeSAqKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgIC8vIERldGVjdCBhY3Rpdml0aWVzIGxvYWRlZCBpbiB0aGUgY3VycmVudCBkb2N1bWVudFxyXG4gICAgLy8gYW5kIGluaXRpYWxpemUgdGhlbTpcclxuICAgICQoJ1tkYXRhLWFjdGl2aXR5XScpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRhY3Rpdml0eSA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGFjdE5hbWUgPSAkYWN0aXZpdHkuZGF0YSgnYWN0aXZpdHknKTtcclxuICAgICAgICBpZiAoYWN0aXZpdGllcy5oYXNPd25Qcm9wZXJ0eShhY3ROYW1lKSkge1xyXG4gICAgICAgICAgICBhY3Rpdml0aWVzW2FjdE5hbWVdLmluaXQoJGFjdGl2aXR5KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbiJdfQ==
;