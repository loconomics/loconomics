/*
    Extension of lodash/groupby which accepts a default set of keys by which to group  
*/
'use strict';

var lodashGroupBy = require('lodash/groupBy'),
    $ = require('jquery');

/*
    groupBy

    Arguments:
        collection: collection parameter used by lodash groupBy function
        iteratee: optional iteratee parameter used by lodash groupBy function
        [defaultKeys]: optional array of group keys to be included in result object, 
                       regardless of whether iteratee yields them via groupBy.
                       If omitted, function will behave identically to the lodash version.

    Examples: 
        groupBy([6.1, 4.2, 6.3], Math.floor) => { '4': [4.2], '6': [6.1, 6.3] }

        groupBy([6.1, 4.2, 6.3], Math.floor, [2, 3, 4]) 
            => { '2': [], '3': [], '4': [4.2], '6': [6.1, 6.3] }
*/
function groupBy(collection, iteratee) {
    var defaultKeys = arguments[2] || [],
        defaultGroups = {};

    defaultKeys.forEach(function(key) { defaultGroups[key] = []; });

    return $.extend(defaultGroups, lodashGroupBy(collection, iteratee));
}

module.exports = groupBy;
