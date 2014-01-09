/**
    User private dashboard section
**/
var 
  $ = require('jquery'),
  toggle = require('../LC/toggle'),
  ProviderPosition = require('../LC/ProviderPosition');

// Code on page ready
$(function () {
  /* Change position state on sidebar links */
  $(document).on('click', '[href = "#togglePositionState"]', function () {
    var 
      $t = $(this),
      v = $t.text(),
      n = toggle(v, ['on', 'off']),
      positionId = $t.closest('[data-position-id]').data('position-id');

    new ProviderPosition(positionId)
    .on(ProviderPosition.prototype.stateChangedEvent, function (state) {
      $t.text(state);
    })
    .changeState(n);

    return false;
  });
});