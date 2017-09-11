// TODO convert to unit test under test/ folder
'use strict';

var filterListBy = require('../source/js/utils/createTimeSlots').filterListBy;

// Testing data set. Array of { input, output, label }
// input is like real input data and output is the expected result
// label is just and identifier of the test
var dataset = [];

// [0]
dataset.push({
    input: {
        params: {
            start: '2016-12-26T08:00:00.000Z',
            end: '2016-12-27T08:00:00.000Z'
        },
        data: [
            {
                "startTime": "2016-12-26T08:00:00+00:00", "endTime": "2016-12-27T08:00:00+00:00", "availability": "free"
            },
            {
                "startTime": "2016-12-27T08:00:00+00:00", "endTime": "2016-12-28T08:00:00+00:00", "availability": "free"
            },
            {
                "startTime": "2016-12-28T08:00:00+00:00", "endTime": "2016-12-29T08:00:00+00:00", "availability": "free"
            }
        ]
    },
    output: {
        data: [
            {
                "startTime": "2016-12-26T08:00:00+00:00", "endTime": "2016-12-27T08:00:00+00:00", "availability": "free"
            }
        ]
    }
});

// [1]
dataset.push({
    input: {
        params: {
            start: '2016-12-26T08:00:00.000Z',
            end: '2016-12-27T08:00:00.000Z'
        },
        data: [
            {
                "startTime": "2016-12-26T04:00:00+00:00", "endTime": "2016-12-26T10:00:00+00:00", "availability": "free"
            },
            {
                "startTime": "2016-12-26T10:00:00+00:00", "endTime": "2016-12-26T18:00:00+00:00", "availability": "unavailable"
            },
            {
                "startTime": "2016-12-26T18:00:00+00:00", "endTime": "2016-12-27T14:00:00+00:00", "availability": "free"
            }
        ]
    },
    output: {
        data: [
            {
                "startTime": "2016-12-26T08:00:00+00:00", "endTime": "2016-12-26T10:00:00+00:00", "availability": "free"
            },
            {
                "startTime": "2016-12-26T10:00:00+00:00", "endTime": "2016-12-26T18:00:00+00:00", "availability": "unavailable"
            },
            {
                "startTime": "2016-12-26T18:00:00+00:00", "endTime": "2016-12-27T08:00:00+00:00", "availability": "free"
            }
        ]
    }
});

// Test util
function assertResult(label, result, extraErrorMessage) {
    if (result) {
        console.info('Success test:', label);
        return true;
    }
    else {
        console.error('Failed test:', label);
        if (extraErrorMessage) {
            console.info('--', extraErrorMessage);
        }
        return false;
    }
}
function assert(label, value, expected, extraMessage) {
    return assertResult(label, value === expected, extraMessage);
}
function testGroup(valueExpectedList) {
    var errors = [];
    valueExpectedList.forEach(function(d) {
        if (d[0] !== d[1]) {
            errors.push(d[2]);
        }
    });
    return errors;
}
function assertGroup(label, valueExpectedList) {
    var errors = testGroup(valueExpectedList);
    return assertResult(label, errors.length === 0, errors.join(', '));
}
function assertTimes(label, value, expected) {
    if (value.length !== expected.length) return assertResult(label, false, 'Different array size');
    var errors = [];
    value.forEach(function(a, i) {
        errors = errors.concat(testGroup([
            [new Date(a.startTime).valueOf(), new Date(expected[i].startTime).valueOf(), 'startTime: ' + a.startTime],
            [new Date(a.endTime).valueOf(), new Date(expected[i].endTime).valueOf(), 'endTime: ' + a.endTime],
            [a.availability, expected[i].availability, 'availability: ' + a.availability]
        ]));
    });
    return assertResult(label, errors.length === 0, errors.join(', '));
}

// Test
var success = true;
dataset.forEach(function(d, i) {
    var result = filterListBy(d.input.data, new Date(d.input.params.start), new Date(d.input.params.end));
    if (!assertTimes('filterListBy, test [' + i + ']', result, d.output.data)) {
        success = false;
    }
    console.log('Result', result);
    console.log('------------------------------');
});
console.log('RESULT:', success ? 'SUCCESS' : 'ERROR');
