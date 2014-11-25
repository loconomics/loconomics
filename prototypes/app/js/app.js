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
