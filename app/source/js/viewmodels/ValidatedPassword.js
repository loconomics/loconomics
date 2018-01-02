/**
  * @module viewmodels/ValidatedPassword
  */
'use strict';

var $ = require('jquery');
var ko = require('knockout');
var PasswordValidator = require('../utils/PasswordValidator');
var Field = require('./Field');
var scrollToElement = require('../utils/scrollToElement');

/*
 * View model representing a password field with validation and messages.
 *
 * The password value is a Field
 * @class
 */
function ValidatedPassword() {
    var MINIMUM_HEIGHT_FOR_SCROLL = 700;
    var SCROLL_ANIMATION_DURATION = 300;
    var hasScrolledToField = false;
    var showRequirements = ko.observable(false);
    var showRequirementsLink = ko.observable(true);

    /**
      * password is the value of the password field
      *
      * @public
      */
    this.password = new Field();

    /**
     * @public
     */
    this.reset = function() {
        showRequirements(false);
        showRequirementsLink(true);
        this.password('');
        hasScrolledToField = false;
    };

    /**
     * Requirements link click handler
     */
    this.requirementsLinkClick = function() {
        showRequirements(true);
    }.bind(this);

    /**
     * Gets the appropiated DOM element to scroll to
     * given the password element field
     * @param {DOMElement} field
     * @returns {jQuery}
     */
    var scrollTarget = function(field) {
        return $(field).parents('.ValidatedPassword').first();
    };

    /**
     * Scroll to the password field when the heigt of the window
     * is under a threshold. Assumption is that small devices will
     * have a soft keyboard that will cover up the password requirements
     * text.
     *
     * @private
     */
    var scrollToField = function(target) {
        // only scroll to the target once and only if we are on a short display
        if($(window).height() < MINIMUM_HEIGHT_FOR_SCROLL && !hasScrolledToField) {
            hasScrolledToField = true;
            scrollToElement(target, {
                animation: { duration: SCROLL_ANIMATION_DURATION }
            });
        }
    };

    /**
     * Password field focus handler
     */
    this.fieldFocus = function(viewModel, event) {
        if (!showRequirements()) {
            // Only hide the link on focus if it hasn't been clicked on already
            showRequirementsLink(false);
        }

        showRequirements(true);

        scrollToField(scrollTarget(event.target));
    }.bind(this);

    /**
     * @public
     */
    this.showRequirements = ko.pureComputed(function() {
        return showRequirements();
    }, this);

    /**
     * @public
     */
    this.showRequirementsLink = ko.pureComputed(function() {
        return showRequirementsLink();
    }, this);

    /**
      * @private
      */
    var validator = ko.pureComputed(function() {
        return new PasswordValidator(this.password());
    }, this);

    this.isValid = ko.pureComputed(function() {
        return validator().isValid();
    }, this);

    this.isLengthValid = ko.pureComputed(function() {
        return validator().isCorrectLength();
    }, this);

    this.isCharacterKindsValid = ko.pureComputed(function() {
        return validator().isCorrectCharacterKinds();
    }, this);

    this.usesSymbol = ko.pureComputed(function() {
        return validator().isCorrectSymbol();
    }, this);

    this.usesUpper = ko.pureComputed(function() {
        return validator().isCorrectUpper();
    }, this);

    this.usesLower = ko.pureComputed(function() {
        return validator().isCorrectLower();
    }, this);

    this.usesNumber = ko.pureComputed(function() {
        return validator().isCorrectNumber();
    }, this);

    this.characterKindsLabel = ko.pureComputed(function() {
        var count = validator().getCorrectCharacterKindsCount();
        var labels = [
            'Includes at least 3 character types:',
            'Includes at least 2 more character types:',
            'Includes at least 1 more character type:',
            'Includes at least 3 character types'
        ];
        return labels[Math.min(count, labels.length - 1)];
    }, this);
}

module.exports = ValidatedPassword;
