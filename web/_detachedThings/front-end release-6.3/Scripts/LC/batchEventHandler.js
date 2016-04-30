/**
    Small utility to wrap a callback/handler function in a timer
    being executed only once (the latest call) inside the timeframe,
    defined by the interval parameter, its just 1 milisecond by default.
    Its useful when an event gets executed
    lots of times too quickly and only 1 execution is wanted to avoid
    hurt performance.
    The default interval of 1 works fine if the event gets raised
    a lot by consecutive code, but if calls are delayed a greater
    interval will be need.
**/
module.exports = function batchEventHandler(cb, interval) {
    var timer;

    return function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            cb.apply(null, arguments);
        }, interval || 1);
    };
};