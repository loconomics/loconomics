/** getDateWithoutTime utility.
    Returns a new Date instance with time at zeroes
    and the same date as the input.
    It returns current date if no valid date or string passed.
**/
'use strict';

module.exports = function getDateWithoutTime(date) {
    if (!date) {
        date = new Date();
    }
    else if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
    );
};
