/**
 * Lets validate a text against our password requirements.
 */
'use strict';
var pwdRequirementsLabel = 'Your password must be at least 8 characters long, have at least: one lowercase letter, one uppercase letter, one symbol (~!@#$%^*&;?.+_), and one numeric digit.';
var pwdRegex = /(?=.{8,})(?=.*?[^\w\s])(?=.*?[0-9])(?=.*?[A-Z]).*?[a-z].*/;
/**
 * Creates a password validator
 * @class
 * @param {string} [msg=pwdRequirementsLabel] Error message when validation fails
 */
function PasswordValidator(msg) {

    var defaultErrorMessage = msg || pwdRequirementsLabel;

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
        // remember and check
        this.latestValue = value;
        var t = pwdRegex.test(value);
        this.errorMessage = t ? defaultErrorMessage : null;
        return t;
    };
}

module.exports = PasswordValidator;
