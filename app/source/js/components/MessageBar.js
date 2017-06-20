/**
  * Message bar object for adding a fixed message below the main navigation
  *
  * Each message bar object injects a template into the app-wide common message
  * bar container element. It also removes that message bar element from the DOM
  * when the object is disposed (see dispose()).
  *
  * Typically an activity will use one message bar at a time. 
  * 
  * They are designed to be shown and hidden, but once a message bar is disposed
  * it should not be used again. Rather, it should be replaced by a new message bar
  * object.
  *
  * Each message bar has a viewModel property used to bind values to the 
  * template.
  * 
  * @class
  */
var ko = require('knockout'),
    $ = require('jquery');

var containerSelector = '.AppMessageBarWrapper';

/**
 * Finds and injects template object. Binds the view model to the template.
 * 
 * @private
 */
var load = function($messageBar, templateName, viewModel) {
    var $container = $(containerSelector),
        $template = $('#' + templateName);

    $messageBar.html($template.html());

    $container.append($messageBar);

    ko.applyBindings(viewModel, $messageBar.get(0));
};

/**
 * Creates a message bar and loads its template into the DOM, in the app-wide common
 * message bar container.
 * 
 * @param {Object} options
 * @param options.templateName ID of a knockout template to be used as the message bar
 * @param options.viewModel viewModel for the knockout template
 * @param {MessageBar.tones} options.tone for the message bar when visible
 * @constructor
 */
var MessageBar = function(options) {
    $.extend(options, {});

    var templateName = options.templateName || '';

    this.viewModel = options.viewModel || {};

    this.isVisible = ko.observable(false);

    this._$messageBar = $('<div>', { 'class': 'MessageBar' });

    this.setTone(options.tone || MessageBar.tones.neutral);

    load(this._$messageBar, templateName, this.viewModel);
};

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
    isVisible ? this.show() : this.hide();
};

/**
 * Makes the message bar visible
 *
 * @param {Object} options
 * @param {Object} options.severityLevel
 */
MessageBar.prototype.show = function() {
    this._$messageBar.show();

    this.isVisible(true);
};

/**
 * Hides the message bar
 */
MessageBar.prototype.hide = function() {
    this._$messageBar.hide();

    this.isVisible(false);
};

/**
 * Hides the message bar and removes it from the DOM. Once this 
 * method is called on a message bar, it shouldn't be used again.
 */
MessageBar.prototype.dispose = function() {
    this.hide();

    this._$messageBar.remove();
};

module.exports = MessageBar;
