/**
    Converts a duration into a text using long
    language words.
    Example: 2:45 -> 2 hours, 45 minutes
    
    Can pass in a moment.duration object or a valid constructor
    parameter.
    Difference with moment.duration.humanize: this shows a precise
    representation, returning exact value for any non-zero unit,
    while humanize is an approximation in the higher unit
    (in the example above, humanize displays: '3 hours')
    
    TODO: I18N
**/
'use strict';

var moment = require('moment');

module.exports = function duration2Language(duration) {
    //jshint maxcomplexity:30
    duration = moment.duration(duration);
    var y = duration.years(),
        d = duration.days(),
        h = duration.hours(),
        m = duration.minutes(),
        s = duration.seconds(),
        l = duration.milliseconds(),
        parts = [];
    
    if (y === 1) parts.push('a year');
    else if (y) parts.push(y + ' years');
    if (d === 1) parts.push('a day');
    else if (d) parts.push(d + ' days');
    if (h === 1) parts.push('an hour');
    else if (h) parts.push(h + ' hours');
    if (m === 1) parts.push('a minute');
    else if (m) parts.push(m + ' minutes');
    if (s === 1) parts.push('a second');
    else if (s) parts.push(s + ' seconds');
    if (l === 1) parts.push('a millisecond');
    else if (l) parts.push(l + ' milliseconds');
    
    return parts.join(', ');
};