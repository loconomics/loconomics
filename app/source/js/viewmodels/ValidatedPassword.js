/**
  *
  */
'use strict';

var ko = require('knockout'),
    PasswordValidator = require('../utils/PasswordValidator'),
    Field = require('./Field');

function ValidatedPassword() {
    this.password = new Field();

    this.showPasswordValidation = ko.observable(false);

    this.showPasswordRequirementsLink = ko.observable(true);

    this.reset = function() {
        this.showPasswordValidation(false);
        this.showPasswordRequirementsLink(true);
        this.password('');
    };

    this.showPasswordRequirements = function() {
        this.showPasswordValidation(true);
    }.bind(this);

    this.passwordFocus = function() {
        this.showPasswordValidation(true);
        this.showPasswordRequirementsLink(false);
    }.bind(this);

    this.passwordValidator = ko.pureComputed(function() {
        return new PasswordValidator(this.password());
    }, this);

    this.isPasswordValid = ko.pureComputed(function() {
        return this.passwordValidator().isValid();
    }, this);

    this.passwordLengthValid = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectLength();
    }, this);

    this.passwordCharacterKindsValid = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectCharacterKinds();
    }, this);

    this.passwordUsesSymbol = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectSymbol();
    }, this);

    this.passwordUsesUpper = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectUpper();
    }, this);

    this.passwordUsesLower = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectLower();
    }, this);

    this.passwordUsesNumber = ko.pureComputed(function() {
        return this.passwordValidator().isCorrectNumber();
    }, this);

    this.passwordCharacterKindsText = ko.pureComputed(function() {
        var count = this.passwordValidator().isCorrectCharacterKindsCount(),
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
