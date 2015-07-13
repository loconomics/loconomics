/**
    Allow attach availability loading and displaying capabilities
    to a datepicker component as part of an activity.
    
    It attaches handlers so it loads and update availability whenever
    the displayed month change, but it returns a method to do it
    on demand, like in the first load after choose a 'current date'
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment');

exports.create = function createDatepickerAvailability(app, $datepicker, isLoading) {
    // Cache DOM elements
    var daysElements = $datepicker.datepicker('getDaysElements');
    // Cache last month showed, to double check later and don't load an already
    // displayed month
    var prevMonth = null;
    
    var tagAvailability = function tagAvailability(date) {
        var month = date.getMonth();
        // Avoid dupes
        if (month === prevMonth) return;
        prevMonth = month;
        
        // We need to know the range of dates being displayed on the
        // monthly calendar, from the first week day of first month week
        // to 6 full weeks.
        var start = moment(date).clone().startOf('month').startOf('week'),
            end = start.clone().add(6, 'weeks');

        // Switch loading flag
        if (isLoading)
            isLoading(true);
        
        // Request the data
        app.model.calendar.getDatesAvailability(start, end)
        .then(function(resultByDates) {
            // We are still in the same showed month? (loading is async, so could have changed)
            if (month !== $datepicker.datepicker('getViewDate').getMonth()) return;
 
            // We received a set of DateAvailability objects per date (iso string key)
            // Iterate every day element, and use its date avail from the result
            daysElements.each(function() {
                // jshint maxcomplexity:10
                var $dateTd = $(this),
                    id = $dateTd.data('date-time'),
                    dateAvail = resultByDates[moment(id).format('YYYY-MM-DD')];   

                // Integrity check to avoid edge case exceptions (must not happens, but stronger code)
                if (!id || !dateAvail) return;

                // Set a date cell class based on its availability
                var cls = '';
                switch(dateAvail.availableTag()) {
                    case 'past':
                        cls = 'tag-muted';
                        break;
                    case 'full':
                        cls = 'tag-blank';
                        break;
                    case 'medium':
                        cls = 'tag-dark';
                        break;
                    case 'low':
                        cls = 'tag-warning';
                        break;
                    case 'none':
                        cls = 'tag-danger';
                        break;
                }
                if (cls) $dateTd.addClass(cls);
            });
        })
        .catch(function(err) {
            app.modals.showError({
                title: 'Error loading availability',
                error: err
            });
        }.bind(this))
        .then(function() {
            // Finally
            if (isLoading)
                isLoading(false);
        }.bind(this));
    };
    
    // Handler to auto load/update availability for displayed day
    $datepicker.on('viewDateChanged', function(e, d) {
        if (d.viewMode === 'days') {
            tagAvailability(d.viewDate);
        }
    });
    
    return tagAvailability;
};
