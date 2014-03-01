/**
  Monthly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend');
var utils = require('./utils');

/**
  Private utils
**/

/**
  Prefetch next month (based on the given dates)
  Note: this code is very similar to utils.weeklyCheckAndPrefetch
**/
function monthlyCheckAndPrefetch(monthly, currentDatesRange) {
  var nextDatesRange = utils.date.nextMonthWeeks(currentDatesRange.start);

  if (!utils.monthlyIsDataInCache(monthly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = datesToQuery(nextDatesRange);
    monthly.fetchData(prefetchQuery, null, true);
  }
}

/**
Move the binded dates the amount of @months specified.
Note: most of this code is adapted from utils.moveBindRangeInDays,
the complexity comes from the prefetch feature, maybe can be that logic
isolated and shared?
**/
function moveBindMonth(monthly, months) {
  var datesRange = utils.date.nextMonthWeeks(monthly.datesRange.start, months);

  // Check cache before try to fetch
  var inCache = utils.monthlyIsDataInCache(monthly, datesRange);

  if (inCache) {
    // Just show the data
    monthly.bindData(datesRange);
    // Prefetch except if there is other request in course (can be the same prefetch,
    // but still don't overload the server)
    if (monthly.fetchData.requests.length === 0)
      monthlyCheckAndPrefetch(monthly, datesRange);
  } else {

    // Support for prefetching:
    // Its avoided if there are requests in course, since
    // that will be a prefetch for the same data.
    if (monthly.fetchData.requests.length) {
      // The last request in the pool *must* be the last in finish
      // (must be only one if all goes fine):
      var request = monthly.fetchData.requests[monthly.fetchData.requests.length - 1];

      // Wait for the fetch to perform and sets loading to notify user
      monthly.$el.addClass(monthly.classes.fetching);
      request.done(function () {
        moveBindMonth(monthly, months);
        monthly.$el.removeClass(monthly.classes.fetching || '_');
      });
      return;
    }

    // Fetch (download) the data and show on ready:
    monthly
    .fetchData(datesToQuery(datesRange))
    .done(function () {
      monthly.bindData(datesRange);
      // Prefetch
      monthlyCheckAndPrefetch(monthly, datesRange);
    });
  }
}

/**
Mark calendar as current-month and disable prev button,
or remove the mark and enable it if is not.
**/
function checkCurrentMonth($el, startDate, monthly) {
  var yep = dateUtils.isInCurrentMonth(date);
  $el.toggleClass(monthly.classes.currentWeek, yep);
  $el.find('.' + monthly.classes.prevAction).prop('disabled', yep);
}

/**
  Update the calendar dates cells for 'day of the month' values
  and number of weeks/rows
**/
function updateDatesCells(monthly) {
  // TODO
}

function getCellByDate(monthly, date) {
  // TODO
}

/**
Montly calendar, inherits from LcWidget
**/
var Monthly = LcWidget.extend(
// Prototype
{
classes: extend({}, utils.weeklyClasses, {
  weeklyCalendar: undefined,
  currentWeek: undefined,
  currentMonth: 'is-currentMonth',
  monthlyCalendar: 'AvailabilityCalendar--monthly'
}),
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataMonthly(datesRange) {
  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  checkCurrentMonth(this.$el, datesRange.start, this);

  updateDatesCells(this);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  var that = this;

  // TODO Re-do for monthly
  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateStatus = that.data.slots[datekey];

    var slot = getCellByDate(that, date);

    slot.addClass(that.classes.slotStatusPrefix + dateStatus);
  });
}
},
// Constructor:
function Monthly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  this.user = this.$el.data('calendar-user');
  this.query = {
    user: this.user,
    type: 'monthly'
  };

  // Start fetching current month
  var firstDates = utils.date.currentMonthWeeks();
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next month in advance
    monthlyCheckAndPrefetch(that, firstDates);
  });

  utils.checkCurrentMonth(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    moveBindMonth(that, -1);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    moveBindMonth(that, 1);
  });

});

/** Static utility: found all components with the Weekly calendar class
and enable it
**/
Monthly.enableAll = function on(options) {
  var list = [];
  $('.' + Monthly.prototype.classes.monthlyCalendar).each(function () {
    list.push(new Monthly(this, options));
  });
  return list;
};

module.exports = Monthly;
