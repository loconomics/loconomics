/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');
require('../components/DatePicker');

exports.init = function initCalendar($activity) {

    var cal = $activity.find('#monthlyCalendar');
    cal.show().datepicker();

    var dayCal = $activity.find('#dayCalendar');

    var $calendarDateHeader = $activity.find('.CalendarDateHeader');
    var dateTitle = $calendarDateHeader.children('.CalendarDateHeader-date');

    cal
    .on('swipeleft', function(e) {
        e.preventDefault();
        cal.datepicker('moveDate', 'next');
    })
    .on('swiperight', function(e) {
        e.preventDefault();
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
    .on('swipeleft', function(e) {
        e.preventDefault();
        cal.datepicker('moveValue', 'next', 'date');
    })
    .on('swiperight', function(e) {
        e.preventDefault();
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

    dateTitle.on('tap', function(e) {
        cal.toggleClass('is-visible');
        e.preventDefault();
        e.stopPropagation();
    });
};
