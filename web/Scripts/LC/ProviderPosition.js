/** ProviderPosition class
  It provides minimun like-jquery event listeners
  with methods 'on' and 'off', and internally 'this.events'
  being a jQuery.Callbacks.
**/
var 
  $ = require('jquery'),
  LcUrl = require('./LcUrl'),
  smoothBoxBlock = require('./smoothBoxBlock'),
  ajaxCallbacks = require('./ajaxCallbacks');

/** Constructor
**/
var ProviderPosition = function (positionId) {
  this.positionId = positionId;

  // Events support through jquery.Callback
  this.events = $.Callbacks();
  this.on = function () { this.events.add.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
  this.off = function () { this.events.remove.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
};

// Using default configuration as prototype
ProviderPosition.prototype = {
  declinedMessageClass: 'info',
  declinedPopupClass: 'position-state-change',
  stateChangedEvent: 'state-changed',
  stateChangedDeclinedEvent: 'state-changed-declined',
  removeFormSelector: '.delete-message-confirm',
  removeFormContainer: '.DashboardYourWork',
  removeMessageClass: 'warning',
  removePopupClass: 'position-state-change'
};

/** changeState to the one given, it will raise a stateChangedEvent on success
  or stateChangedDeclinedEvent on error.
  @state: 'on' or 'off'
**/
ProviderPosition.prototype.changeState = function changePositionState(state) {
  var page = state == 'on' ? '$Reactivate' : '$Deactivate';
  var $d = $('#main');
  var that = this;
  var ctx = { form: $d, box: $d };
  $.ajax({
    url: LcUrl.LangPath + 'dashboard/position/' + page + '/?PositionID=' + this.positionId,
    context: ctx,
    error: ajaxCallbacks.error,
    success: function (data, text, jx) {
      $d.one('ajaxSuccessPost', function (event, data, t, j, ctx) {
        if (data && data.Code > 100) {
          if (data.Code == 101) {
            that.events.fire(state);
          } else {
            // Show message:
            var msg = $('<div/>').addClass(that.declinedMessageClass).append(data.Result.Message);
            smoothBoxBlock.open(msg, $d, that.declinedPopupClass, { closable: true, center: false, autofocus: false });
          }
        }
      });
      // Process the result, that eventually will call ajaxSuccessPost
      ajaxCallbacks.doJSONAction(data, text, jx, ctx);
    }
  });
  return this;
};

/**
    Delete position
**/
ProviderPosition.prototype.remove = function deletePosition() {

    var c = $(this.removeFormContainer),
        f = $(this.removeFormSelector),
        popupForm = f.clone();

    popupForm.one('ajaxSuccessPost', '.ajax-box', function (data) {
        if (data && data.Code) {

            if (data.Result && data.Result.Message) {
                var msg = $('<div/>').addClass(that.removeMessageClass).append(data.Result.Message);
                smoothBoxBlock.open(msg, $d, that.removePopupClass, { closable: true, center: false, autofocus: false });
            }

            switch (data.Code) {
                case 101:
                    that.events.fire('removed', [data.Result]);
                    // Current position page doesn't exist now!
                    window.location.reload();
                    break;
                case 103:
                    that.events.fire('remove-failed', [data.Result]);
                    break;
            }
        }

    });

    // Open confirmation form
    var b = smoothBoxBlock.open(popupForm, c, null, { closable: true });
};

module.exports = ProviderPosition;