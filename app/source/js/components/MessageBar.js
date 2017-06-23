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
  * move the component DOM element to be directly under the <body> element. This is
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
var MessageBar = function(params, element) {
    this._$component = $(element);
    this._$originalParent = this._$component.parent();
    this._$messageBar = $('.MessageBar', this._$component);
    this._$messageBarSpacer = $('<div>', { "class" : 'MessageBarSpacer' });
    this._$parts = this._$messageBarSpacer.add(this._$messageBar);

    this.params = params;
    this._subscriptions = [];

    this.params.visible = this.params.visible || ko.observable(true);
    this._subscriptions.push(this.params.visible.subscribe(this.setVisible, this));
    this.setVisible(this.params.visible());

    this.params.tone = this.params.tone || ko.observable(MessageBar.tones.neutral);
    this._subscriptions.push(this.params.tone.subscribe(this.setTone, this));
    this.setTone(this.params.tone());

    // to fix position within the viewport, the message bar must be outside the activity
    $('body').append(this._$component);

    // To avoid modifying the activity style or class, insert a spacer in place of
    // the message bar component. This will push activity content down far enough
    // to create visual space for the message bar.
    this._$originalParent.prepend(this._$messageBarSpacer);
};

MessageBar.template = '<div class="MessageBar"><!-- ko template: { nodes: $componentTemplateNodes, data: params } --><!-- /ko --></div>';

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
    this._$messageBarSpacer.remove();

    // Put the component back under the original parent
    this._$originalParent.prepend(this._$component);
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
    isVisible ? this._$parts.show() : this._$parts.hide();
};

module.exports = MessageBar;
