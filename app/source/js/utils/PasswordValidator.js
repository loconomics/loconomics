/**
 * Lets validate a text against our password requirements.
 */
'use strict';

var rLength = /.{8,}/;  // at least 8 characters long
var rSymbol = /[^\w\s]|_/; // at least one of ~!@#$%^*&;?.+_
var rNumber = /[0-9]/; // at least 1 number
var rUpper = /[A-Z]/; // at least 1 uppercase letter
var rLower = /[a-z]/; // at least 1 lowercase letter
var MIN_REQUIREMENTS = 3;

/**
 * Creates a password validator
 * @class
 * @param {string} password the password to validate
 */
function PasswordValidator(password) {
    /**
     * Checks if the value is valid. It sets instance properties with latest
     * value and resulting errorMessage
     * @param {string} value Text to be validated
     * @returns {boolean} True if valid.
     */
    var test = function(value) {
        // check
        this.correctLength = rLength.test(value);
        this.correctSymbol = rSymbol.test(value);
        this.correctNumber = rNumber.test(value);
        this.correctUpper = rUpper.test(value);
        this.correctLower = rLower.test(value);

        // Lenght is ever required, others requirements are optional if
        // almost a minimum amount are met.
        this.correctCharacterKindsCount = this.correctSymbol + this.correctNumber +
            this.correctUpper + this.correctLower;

        this.correctCharacterKinds = this.correctCharacterKindsCount >= MIN_REQUIREMENTS;
    }.bind(this);

    test(password || '');
}

/**
 * @public
 */
PasswordValidator.prototype.isCorrectLength = function() {
    return this.correctLength;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectSymbol = function() {
    return this.correctSymbol;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectNumber = function() {
    return this.correctNumber;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectUpper = function() {
    return this.correctUpper;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectLower = function() {
    return this.correctLower;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectCharacterKindsCount = function() {
    return this.correctCharacterKindsCount;
};

/**
 * @public
 */
PasswordValidator.prototype.isCorrectCharacterKinds = function() {
    return this.correctCharacterKinds;
};

/**
 * @public
 */
PasswordValidator.prototype.isValid = function() {
    return this.isCorrectLength() && this.isCorrectCharacterKinds();
};

module.exports = PasswordValidator;
