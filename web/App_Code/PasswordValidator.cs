using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using System.Web.WebPages;

/// <summary>
/// Validator class for password, compatible with use at WebPages validation.
/// 
/// For HIPAA compliance (#974) and strong security, passwords must be:
/// - Almost 8 characters
/// - 3 out of these 4 requirements:
/// - Non-alphabetic characters: ~!@#$%^*&;?.+_
/// - Base 10 digits (0 through 9)
/// - English uppercase characters (A through Z)
/// - English lowercase characters (a through z)
/// </summary>
public class PasswordValidator : IValidator
{
    #region Instance Properties
    private string defaultErrorMessage = InvalidPasswordErrorMessage;
    public string LatestValue
    {
        get;
        private set;
    }
    public string ErrorMessage
    {
        get;
        private set;
    }
    #endregion

    #region Const values
    const int MIN_REQUIREMENTS = 3;
    public const string InvalidPasswordErrorMessage = @"Your password must be at least 8 characters long, have at least 3 out of these 4 requirements: one lowercase letter, one uppercase letter, one numeric digit and one symbol (~!@#$%^*&;?.+_).";
    static readonly Regex rLength = new Regex(@".{8,}", RegexOptions.ECMAScript);
    static readonly Regex rSymbol = new Regex(@"[^\w\s]", RegexOptions.ECMAScript);
    static readonly Regex rNumber = new Regex(@"[0-9]", RegexOptions.ECMAScript);
    static readonly Regex rUpper = new Regex(@"[A-Z]", RegexOptions.ECMAScript);
    static readonly Regex rLower = new Regex(@"[a-z]", RegexOptions.ECMAScript);
    #endregion

    #region Validation
    public PasswordValidator(string msg = null)
    {
        if (!String.IsNullOrEmpty(msg)) defaultErrorMessage = msg;
    }

    public bool Test(string value)
    {
        // cache
        if (value == this.LatestValue) return this.ErrorMessage == null;
        // remember
        this.LatestValue = value;
        // check
        var correctLength = rLength.IsMatch(value);
        var correctSymbol = rSymbol.IsMatch(value);
        var correctNumber = rNumber.IsMatch(value);
        var correctUpper = rUpper.IsMatch(value);
        var correctLower = rLower.IsMatch(value);
        // Lenght is ever required, others requirements are optional if
        // almost a minimum amount are met.
        var count =
            (correctSymbol ? 1 : 0) +
            (correctNumber ? 1 : 0) +
            (correctUpper ? 1 : 0) +
            (correctLower ? 1 : 0);
        var valid = correctLength && count >= MIN_REQUIREMENTS;
        // set error
        this.ErrorMessage = valid ? null : defaultErrorMessage;
        return valid;
    }
    #endregion

    #region Useful static methods
    public static bool IsValid(string value)
    {
        var validator = new PasswordValidator();
        return validator.Test(value);
    }
    #endregion

    #region IValidator
    public ModelClientValidationRule ClientValidationRule
    {
        get;
        private set;
    }
    public ValidationResult Validate(ValidationContext validationContext)
    {
        ClientValidationRule = new ModelClientValidationRule()
        {
            ErrorMessage = ErrorMessage,
            ValidationType = "password"
        };

        var context = validationContext.ObjectInstance as HttpContextBase;

        if (context == null)
        {
            throw new Exception("Invalid validation context");
        }
        var value = context.Request.Form[validationContext.MemberName] as string;
        if (Test(value))
        {
            return ValidationResult.Success;
        }
        else
        {
            return new ValidationResult(ErrorMessage, new[] { validationContext.MemberName });
        }
    }
    #endregion
}
