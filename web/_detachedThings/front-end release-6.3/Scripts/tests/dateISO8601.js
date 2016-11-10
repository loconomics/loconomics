/** dateISO8601 tests file.
 **/
test("Parsing dates and times", function () {
  var v,
      str,
      dateISO = require('LC/dateISO8601');

  str = '2014-01-20';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);

  str = '20140120';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);

  str = '02:30:15';
  v = dateISO.parse(str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '023015';
  v = dateISO.parse(str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '2014-01-20T02:30:15';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '20140120T023015';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '2014-01-20T02:30:15Z';
  v = dateISO.parse(str);
  equal(v.getUTCFullYear(), 2014, "Matched UTC year in " + str);
  equal(v.getUTCMonth(), 1, "Matched UTC month in " + str);
  equal(v.getUTCDate(), 20, "Matched UTC date in " + str);
  equal(v.getUTCHours(), 2, "Matched UTC hours in " + str);
  equal(v.getUTCMinutes(), 30, "Matched UTC minutes in " + str);
  equal(v.getUTCSeconds(), 15, "Matched UTC seconds in " + str);

  str = '20140120T023015+01';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '20140120T023015+01:00';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '20140120T023015-11';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);

  str = '20140120T023015-11:30';
  v = dateISO.parse(str);
  equal(v.getFullYear(), 2014, "Matched year in " + str);
  equal(v.getMonth(), 1, "Matched month in " + str);
  equal(v.getDate(), 20, "Matched date in " + str);
  equal(v.getHours(), 2, "Matched hours in " + str);
  equal(v.getMinutes(), 30, "Matched minutes in " + str);
  equal(v.getSeconds(), 15, "Matched seconds in " + str);
});
