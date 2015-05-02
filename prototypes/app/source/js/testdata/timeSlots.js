/** 
    timeSlots
    testing data
**/

var Time = require('../utils/Time');

var moment = require('moment');

var today = new Date(),
    tomorrow = new Date(),
    tomorrowPast2 = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrowPast2.setDate(tomorrowPast2.getDate() + 2);

var stoday = moment(today).format('YYYY-MM-DD'),
    stomorrow = moment(tomorrow).format('YYYY-MM-DD'),
    stomorrowPast2 = moment(tomorrowPast2).format('YYYY-MM-DD');

var testData1 = [
    Time(today, 9, 15),
    Time(today, 11, 30),
    Time(today, 12, 0),
    Time(today, 12, 30),
    Time(today, 16, 15),
    Time(today, 18, 0),
    Time(today, 18, 30),
    Time(today, 19, 0),
    Time(today, 19, 30),
    Time(today, 21, 30),
    Time(today, 22, 0)
];

var testData2 = [
    Time(tomorrow, 8, 0),
    Time(tomorrow, 10, 30),
    Time(tomorrow, 11, 0),
    Time(tomorrow, 11, 30),
    Time(tomorrow, 12, 0),
    Time(tomorrow, 12, 30),
    Time(tomorrow, 13, 0),
    Time(tomorrow, 13, 30),
    Time(tomorrow, 14, 45),
    Time(tomorrow, 16, 0),
    Time(tomorrow, 16, 30)
];

var testData3 = [
    Time(tomorrowPast2, 10, 0),
    Time(tomorrowPast2, 11, 0),
    Time(tomorrowPast2, 12, 30),
    Time(tomorrowPast2, 13, 15),
    Time(tomorrowPast2, 16, 0),
    Time(tomorrowPast2, 17, 30),
    Time(tomorrowPast2, 18, 0)
];

var testDataBusy = [
];

var testData = {
    'default': testDataBusy
};
testData[stoday] = testData1;
testData[stomorrow] = testData2;
testData[stomorrowPast2] = testData3;

exports.timeSlots = testData;
