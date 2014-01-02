/* Extra utilities and methods 
 */
var TimeSpan = require('TimeSpan');
var nu = require('numberUtils');

/** Shows time as a large string with units names for values different than zero.
 **/
function smartTime(time) {
    var r = [];
    if (time.days > 1)
        r.push(time.days + ' days');
    else if (time.days == 1)
        r.push('1 day');
    if (time.hours > 1)
        r.push(time.hours + ' hours');
    else if (time.hours == 1)
        r.push('1 hour');
    if (time.minutes > 1)
        r.push(time.minutes + ' minutes');
    else if (time.minutes == 1)
        r.push('1 minute');
    if (time.seconds > 1)
        r.push(time.seconds + ' seconds');
    else if (time.seconds == 1)
        r.push('1 second');
    if (time.milliseconds > 1)
        r.push(time.milliseconds + ' milliseconds');
    else if (time.milliseconds == 1)
        r.push('1 millisecond');
    return r.join(', ');
}

/** Rounds a time to the nearest 15 minutes fragment.
@roundTo specify the LC.roundingTypeEnum about how to round the time (down, nearest or up)
**/
function roundTimeToQuarterHour(/* TimeSpan */time, /* LC.roundingTypeEnum */roundTo) {
    var restFromQuarter = time.totalHours() % .25;
    var hours = time.totalHours();
    if (restFromQuarter > 0.0) {
        switch (roundTo) {
            case nu.roundingTypeEnum.Down:
                hours -= restFromQuarter;
                break;
            default:
            case nu.roundingTypeEnum.Nearest:
                var limit = .25 / 2;
                if (restFromQuarter >= limit) {
                    hours += (.25 - restFromQuarter);
                } else {
                    hours -= restFromQuarter;
                }
                break;
            case nu.roundingTypeEnum.Up:
                hours += (.25 - restFromQuarter);
                break;
        }
    }
    return TimeSpan.fromHours(hours);
};

// Extend a given TimeSpan object with the Extra methods
function plugIn(TimeSpan) {
    TimeSpan.prototype.toSmartString = function timeSpan_proto_toSmartString() { return smartTime(this); };
    TimeSpan.prototype.roundToQuarterHour = function timeSpan_proto_roundToQuarterHour() { return roundTimeToQuarterHour.call(this, parameters); };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        smartTime: smartTime,
        roundToQuarterHour: roundToQuarterHour,
        plugIn: plugIn
    };
