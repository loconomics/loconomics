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
            dateTitle.text(date.format('LL'));
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
