/**
  AvailabilityCalendar Module
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601');

var classes = {
  calendar: 'AvailabilityCalendar',
  loading: 'is-loading',
  actions: 'AvailabilityCalendar-actions',
  prevAction: 'Actions-prev',
  nextAction: 'Actions-next',
  days: 'AvailabilityCalendar-days',
  slots: 'AvailabilityCalendar-slots',
  slotHour: 'AvailabilityCalendar-hour',
  slotStatusPrefix: 'is-',
  legend: 'AvailabilityCalendar-legend',
  legendAvailable: 'AvailabilityCalendar-legend-available',
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable'
};

var statusTypes = ['unavailable', 'available'];

var defaults = {
  classes: classes,
  dataSourceUrl: '/calendar/get-availability/',
};

function on(selector, options) {
  options = $.extend(true, {}, defaults, options);
  selector = selector || '.' + options.classes.calendar;

  $(selector).each(function () {
    var calendar = $(this);
    var user = calendar.data('calendar-user');
    var dataSourceUrl = calendar.data('source-url') || options.dataSourceUrl;
    var dataSource = calendar.data('source') || {};
    if (typeof(dataSource) == 'string')
      dataSource = JSON.parse(dataSource);

    function fetchData(start, end) {
      calendar.addClass(options.classes.loading);
      return $.getJSON(dataSourceUrl,
        {
          user: user,
          start: dateISO.datetimeLocal(start, true),
          end: dateISO.datetimeLocal(end, true)
        },
        function(data){
          if (data && data.Code === 0) {
            $.extend(true, dataSource, data.Result);
            calendar.removeClass(options.classes.loading);
          } else {
            // TODO Manage error
            if (console && console.error) console.error('AvailabilityCalendar fetch data error %o', data);
          }
        }
      );
    }

    function moveBindRangeInDays(days) {
      var
        start = addDays( calendar.data('calendar-start-date'), days ),
        end = addDays( calendar.data('calendar-end-date'), days );

      // Check cache: if there is almost one date in the range
      // without data, we set inCache as false and fetch the data:
      var inCache = true;
      eachDateInRange(start, end, function(date) {
        var datekey = dateISO.dateLocal(date, true);
        if (!dataSource.slots[datekey]) {
          inCache = false;
          return false;
        }
      });

      if (inCache)
        // Just show the data
        bindData(calendar, dataSource, options, start, end);
      else
        // Fetch (download) the data and show on ready:
        fetchData(start, end).done(function(){
          bindData(calendar, dataSource, options, start, end);
        });
    }

    calendar.on('click', '.' + options.classes.prevAction, function prev(){
      moveBindRangeInDays(-7);
    });

    calendar.on('click', '.' + options.classes.nextAction, function next(){
      moveBindRangeInDays(7);
    });

    // Fetch current week
    var start = getFirstWeekDate(new Date()),
      end = getLastWeekDate(new Date());

    fetchData(start, end).done(function(){
      bindData(calendar, dataSource, options, start, end);
    });
  });
}

function bindData(calendar, dataSource, options, start, end) {
  var slotsContainer = calendar.find('.' + options.classes.slots),
    slots = slotsContainer.find('td');

  // Save the date range being showed in the calendar instance
  calendar.data('calendar-start-date', start);
  calendar.data('calendar-end-date', end);

  updateLabels(calendar, options);

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass( options.classes.slotStatusPrefix + statusTypes[s] );
  }

  // Set all slots with default status
  slots.addClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );

  eachDateInRange(start, end, function(date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = dataSource.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = findSlotCell(slotsContainer, i, slot);
        // Remove default status
        slotCell.removeClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );
        // Adding status class
        slotCell.addClass( options.classes.slotStatusPrefix + dataSource.status );
      }
    }
  });
}

function updateLabels(calendar, options) {
  var start = calendar.data('calendar-start-date'),
      end = calendar.data('calendar-end-date');

  // TODO
}

function findSlotCell(slotsContainer, day, slot) {
  slot = dateISO.parse(slot);
  var
    x = Math.round( slot.getHours() ),
    // Time frames (slots) are 15 minutes divisions
    y = Math.round( slot.getMinutes() / 15 ),
    tr = slotsContainer.children(':eq(' + Math.round( x * 4 + y ) + ')' );
  
  // Slot cell for o'clock hours is at 1 position offset
  // because of the row-head cell
  var dayOffset = ( y === 0 ? day + 1 : day );
  return tr.children(':eq(' + dayOffset + ')');
}

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() - d.getDay() );
  return d;
}

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() + (7 - d.getDay()) );
  return d;
}

function addDays(date, days) {
  var d = new Date(date);
  d.setDate( d.getDate() + days );
  return d;
}

function eachDateInRange(start, end, fn) {
  if (!fn.call) throw new Error('fn must be a function or "call"able object');
  var date = new Date(start);
  var i = 0, ret;
  while (date <= end) {
    ret = fn.call(fn, date, i);
    // Allow fn to cancel the loop with strict 'false'
    if (ret === false)
      break;
    date.setDate(date.getDate() + 1);
    i++;
  }
}

// Public API:
exports.defaults = defaults;
exports.on = on;