/**
  * @module viewmodels/ValidatedPassword
  */
'use strict';

var ko = require('knockout'),
    PasswordValidator = require('../utils/PasswordValidator'),
    Field = require('./Field');

/*
 * View model representing a password field with validation and messages.
 * 
 * The password value is a Field 
 * @class
 */
function ValidatedPassword() {
    /**
      * password is the value of the password field
      *
      * @public
      */
    this.password = new Field();
    this.showRequirements = ko.observable(false);
    this.showRequirementsLink = ko.observable(true);

    /**
     * @public
     */
    this.reset = function() {
        this.showRequirements(false);
        this.showRequirementsLink(true);
        this.password('');
    };

    this.requirementsLinkClick = function() {
        this.showRequirements(true);
    }.bind(this);

    this.fieldFocus = function() {
        this.showRequirements(true);
        this.showRequirementsLink(false);
    }.bind(this);

    /**
      * @private
      */ 
    this.validator = ko.pureComputed(function() {
        return new PasswordValidator(this.password());
    }, this);

    this.isValid = ko.pureComputed(function() {
        return this.validator().isValid();
    }, this);

    this.isLengthValid = ko.pureComputed(function() {
        return this.validator().isCorrectLength();
    }, this);

    this.isCharacterKindsValid = ko.pureComputed(function() {
        return this.validator().isCorrectCharacterKinds();
    }, this);

    this.usesSymbol = ko.pureComputed(function() {
        return this.validator().isCorrectSymbol();
    }, this);

    this.usesUpper = ko.pureComputed(function() {
        return this.validator().isCorrectUpper();
    }, this);

    this.usesLower = ko.pureComputed(function() {
        return this.validator().isCorrectLower();
    }, this);

    this.usesNumber = ko.pureComputed(function() {
        return this.validator().isCorrectNumber();
    }, this);

    this.characterKindsLabel = ko.pureComputed(function() {
        var count = this.validator().isCorrectCharacterKindsCount(),
            labels = [
                    'Includes at least 3 kinds of characters:',
                    'Includes at least 2 more kinds of characters:',
                    'Includes at least 1 more kind of character:',
                    'Includes at least 3 kinds of characters'
                ];
        return labels[Math.min(count, labels.length - 1)];
    }, this);
}

module.exports = ValidatedPassword;
