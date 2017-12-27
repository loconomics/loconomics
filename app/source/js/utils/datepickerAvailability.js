/**
    Allow attach availability loading and displaying capabilities
    to a datepicker component as part of an activity.

    It attaches handlers so it loads and update availability whenever
    the displayed month change, but it returns a method to do it
    on demand, like in the first load after choose a 'current date'
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    createTimeSlots = require('./createTimeSlots');
var availability = require('../data/availability');
var showError = require('../modals/error').show;

exports.create = function createDatepickerAvailability(app, $datepicker, isLoading) {
    // Cache DOM elements
    var daysElements = $datepicker.datepicker('getDaysElements');
    // Cache last month showed, to double check later and don't load an already
    // displayed month
    var prevMonth = null;
    var prevUserID = null;

    // Listen to cache changes in order to force a data load (to avoid invalid
    // availability being displayed after an apt was modified)
    availability.cacheCleaningRequested.subscribe(function() {
        prevMonth = null;
    });

    /**
        It tags, if the month changed, the calendar with the Date Availability.
        The refresh param forces the process even if the same month than previously tagged/rendered
    **/
    var tagAvailability = function tagAvailability(date, userID, refresh) {
        var month = date.getMonth();
        // Avoid dupes and non-data
        if (!userID || month === prevMonth && prevUserID === userID && !refresh) return;
        prevMonth = month;
        prevUserID = userID;

        // We need to know the range of dates being displayed on the
        // monthly calendar, from the first week day of first month week
        // to 6 full weeks.
        var start = moment(date).clone().startOf('month').startOf('week'),
            end = start.clone().add(6, 'weeks');

        // Switch loading flag
        if (isLoading)
            isLoading(true);

        // Request the data
        availability.times(userID, start, end)
        .then(function(result) {
            // We are still in the same showed month? (loading is async, so could have changed)
            if (month !== $datepicker.datepicker('getViewDate').getMonth()) return;

            var byDate = createTimeSlots.splitListInLocalDates(result.times);

            // We have a list or ranges per date (iso string key)
            // Iterate every day element, and use its date avail from the result
            daysElements.each(function() {
                /* eslint complexity:"off" */
                var $dateTd = $(this);
                var id = $dateTd.data('date-time');
                var timeRangeList = byDate[moment(id).format('YYYY-MM-DD')];
                var $dateTag = $dateTd.find('.DatePicker-tag');

                // Integrity check to avoid edge case exceptions
                // ('must' not happens, but stronger code)
                if (!id || !timeRangeList) return;

                // Set a date cell class based on its availability
                var cls = '';
                var ariaLabel = '';
                switch(createTimeSlots.getAvailabilityTag(timeRangeList)) {
                    case 'past':
                        cls = 'text-muted';
                        ariaLabel = 'Past date';
                        break;
                    case 'full':
                        cls = 'text-muted ion-ios-circle-filled';
                        ariaLabel = 'Schedule is fully booked';
                        break;
                    case 'medium':
                        cls = 'text-warning ion-contrast';
                        ariaLabel = 'Schedule is more than 50% booked';
                        break;
                    case 'low':
                        cls = 'text-success ion-ios-circle-outline';
                        ariaLabel = 'Schedule is less than 50% booked';
                        break;
                    case 'none':
                        cls = 'text-danger ion-ios-close';
                        ariaLabel = 'Schedule is blocked';
                        break;
                }
                $dateTag
                .attr('class', 'DatePicker-tag ' + cls)
                .attr('aria-label', ariaLabel);
            });
        })
        .catch(function(err) {
            showError({
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
            tagAvailability(d.viewDate, prevUserID);
        }
    });

    return tagAvailability;
};
