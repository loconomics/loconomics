/**
 * Lets validate a text against our password requirements.
 */
'use strict';
var DEFAULT_ERROR = 'Your password must be at least 8 characters long, have at least 3 out of these 4 requirements: one lowercase letter, one uppercase letter, one numeric digit and one symbol (~!@#$%^*&;?.+_).';
var rLength = /.{8,}/;
var rSymbol = /[^\w\s]/;
var rNumber = /[0-9]/;
var rUpper = /[A-Z]/;
var rLower = /[a-z]/;
var MIN_REQUIREMENTS = 3;

/**
 * Creates a password validator
 * @class
 * @param {string} [msg=DEFAULT_ERROR] Error message when validation fails
 */
function PasswordValidator(msg) {

    var defaultErrorMessage = msg || DEFAULT_ERROR;

    /**
     * Error message from last tested value
     */
    this.errorMessage = null;

    /**
     * Latest tested value
     */
    this.latestValue = null;

    /**
     * Checks if the value is valid. It sets instance properties with latest
     * value and resulting errorMessage
     * @param {string} value Text to be validated
     * @returns {boolean} True if valid.
     */
    this.test = function(value) {
        // cache
        if (value === this.latestValue) return !!this.errorMessage;
        // remember
        this.latestValue = value;
        // check
        this.correctLength = rLength.test(value);
        this.correctSymbol = rSymbol.test(value);
        this.correctNumber = rNumber.test(value);
        this.correctUpper = rUpper.test(value);
        this.correctLower = rLower.test(value);
        // Lenght is ever required, others requirements are optional if
        // almost a minimum amount are met.
        var count = this.correctSymbol + this.correctNumber +
            this.correctUpper + this.correctLower;
        var valid = this.correctLength && count >= MIN_REQUIREMENTS;
        // set error
        this.errorMessage = valid ? null : defaultErrorMessage;
        return valid;
    };
}

module.exports = PasswordValidator;
