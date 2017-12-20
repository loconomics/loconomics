/**
  * Message bar object for adding a fixed message below the main navigation
  *
  * Do not initialize this component directly. Use the app-message-bar component
  * instead.
  *
  * If the activity and its template are not disposed, then it should hide the message
  * bar when it is hidden.
  *
  * When a message bar component is initialized and rendered, the view model will
  * move the message bar DOM element to be directly under the <body> element. This is
  * due to constraints in the layout styles for the navigation bar and activities.
  *
  * Customize the content of the message bar by including markup in the
  * <app-message-bar> tag. Named items in the params attribute on the
  * component tag will be passed through to the template markup included in the
  * component. For example:
  *
  * <app-message-bar param="arbitraryParam: someObservable">
  *     <p data-bind="text: arbitraryParam"></p>
  * </app-message-bar>
  *
  * There are well-known params to set options on the message bar. See the constructor
  * docs below.
  *
  * @class
  */
var $ = require('jquery'),
    ko = require('knockout');

/**
 * Initialized by knockout components.
 *
 * Params included in the component tag are passed through to any template inside the
 * component markup. There are well-known params to include as observables:
 *
 * @param {Object} params
 * @param {Knockout Observer Boolean} params.visible the message bar will be visible when this observable is true, hidden otherwise. If this is not included, the message bar will always be visible
 * @param {Knockout Observer MessageBar.tones} params.tone for the message bar when visible
 *
 * @constructor
 */
var MessageBar = function(params, element, templateNodes) {
    this._$component = $(element);
    this._$messageBarSpacer = $('.MessageBarSpacer', this._$component);
    this._$messageBar = $('<div>', { 'class' : 'MessageBar', 'html': '<!-- ko template: { nodes: templateNodes, data: params } --><!-- /ko -->' });
    this._$parts = this._$messageBarSpacer.add(this._$messageBar);

    this.templateNodes = templateNodes;

    this.params = params;
    this.params.visible = this.params.visible || ko.observable(true);
    this.params.tone = this.params.tone || ko.observable(MessageBar.tones.neutral);

    this._subscriptions = [];

    this._subscriptions.push(this.params.visible.subscribe(this.setVisible, this));
    this.setVisible(this.params.visible());

    this._subscriptions.push(this.params.tone.subscribe(this.setTone, this));
    this.setTone(this.params.tone());

    // The template nodes are added to the message bar. The message bar is removed from
    // the component element, so we must explicitly bind the message bar to this
    // view model
    ko.applyBindings(this, this._$messageBar.get(0));
};

MessageBar.template = '<div class="MessageBarSpacer"></div>';

/**
 * Enumeration of tones for the message bar (represents classes
 * for different themes)
 *
 * @enum
 */
MessageBar.tones = {
    neutral: { 'class': ''},
    warning: { 'class': 'MessageBar--warning' },
    success: { 'class': 'MessageBar--success' }
};

/**
 *  Clears all tone classes from message bar
 *
 *  @param {jQuery} $messageBar from which to remove all tone classes
 *  @private
 */
var clearToneClasses = function($messageBar) {
    for(var tone in MessageBar.tones) {
        $messageBar.removeClass((MessageBar.tones[tone])['class']);
    }
};

/**
 * Dispose function called by knockout
 */
MessageBar.prototype.dispose = function() {
    this._subscriptions.forEach(function(subscription) {
        subscription.dispose();
    });

    // We created this element. Remove it.
    this._$messageBar.remove();
};

/**
 * Set the tone for the message bar
 *
 * @param {MessageBar.tones} tone
 */
MessageBar.prototype.setTone = function(tone) {
    clearToneClasses(this._$messageBar);

    this._$messageBar.addClass(tone['class']);
};

/**
 * Show/hide message bar via parameter
 *
 * @param {Boolean} isVisible set to true to show message bar, false to hide it
 */
MessageBar.prototype.setVisible = function(isVisible) {
    return isVisible ? this.show() : this.hide();
};

/**
 * Show message bar.
 */
MessageBar.prototype.show = function() {
    // Message bar is under body so it can be positioned correctly
    $('body').append(this._$messageBar);

    this._$parts.show();
};

/**
 * Hide message bar.
 */
MessageBar.prototype.hide = function() {
    this._$parts.hide();

    // Keep the DOM tidy by temporarily removing the message bar from the DOM
    // If we insert _$messageBar back into the DOM under the component element,
    // then ko will try to reapply bindings to the contents of the message bar
    // when any of the param observables change. This raises an exception because
    // MessageBar _already_ applied bindings manually in the constructor above.
    this._$messageBar.detach();
};

module.exports = MessageBar;
