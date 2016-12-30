'use strict';

var timeZoneList = require('../source/js/utils/timeZoneList');

// Try to enumerate all
var d = timeZoneList.getFullList().map(function(zone) {
    return [zone.id, timeZoneList.getUsAliasWhenPossible(zone.id)];
})
.filter(function(d) {
    return d[0] !== d[1];
});

console.dir(d);
