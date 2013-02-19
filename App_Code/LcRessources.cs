using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Ressources for common texts
/// </summary>
public static class LcRessources
{
    public const string ValidationSummaryTitle = "Please correct the errors and try again:";
    public const string DataSaved = "Saved successfully!";
    public const string ShortDataSaved = "Saved";
    public const string RequestSent = "Request sent!";
    public const string MessageSent = "Message was sent";
    public const string FieldXIsRequired = "{0} is required";

    private static Dictionary<string, string> textress = new Dictionary<string,string>(){
         { "messaging-message-type-title-inquiry", "Inquiry" }
        ,{ "messaging-message-type-title-marketing", "Marketing" }
        ,{ "messaging-message-type-title-booking-dispute", "Booking Dispute" }
        ,{ "messaging-message-type-title-booking-dispute-resolution", "Booking Dispute Resolution" }
        ,{ "messaging-message-type-title-booking-review", "Booking Review" }
        ,{ "messaging-message-type-title-bookingrequest", "Booking Request" }
        ,{ "messaging-message-type-title-bookingrequest-confirmation", "Booking Request Confirmation" }
        ,{ "messaging-message-type-title-bookingrequest-denegation", "Booking Request Denegation" }
        ,{ "messaging-message-type-title-booking", "Booking" }

        ,{ "Experience Level", "Experience Level" }
        ,{ "Experience Level Description", "" }
        ,{ "Language Level", "Language Level" }
        ,{ "Language Level Description", "" }

        ,{ "postal-code-validation-error", "Zip code is not valid" }
        ,{ "quit-without-save", "You will lose changes if you continue, are you sure?" }
        ,{ "an-error", "There was an error: {0}" }
        ,{ "changes-not-saved", "You made changes but forgot to save!" }
        ,{ "tab-has-changes-stay-on", "Go back" }
        ,{ "tab-has-changes-continue-without-change", "Continue anyway" }

        ,{ "DataSavedAndPositionEnabled", "Congratulations, your {0} profile is now active and can be viewed publicly! <a href='{1}'>View it here</a>" }

        ,{ "PositionActivationProgress", "You've completed {0} out of {1} steps to activate your {2} profile." }
        ,{ "PositionActivationComplete", "Your {1} profile is now public." }
    };
    public static string GetText(string key) {
        if (textress.ContainsKey(key))
            return textress[key];
        return key;
    }
    public static string GetText(string key, params object[] values) {
        return String.Format(GetText(key), values);
    }
    public static string RequiredField(string fieldLabel) {
        var l = fieldLabel != null ? fieldLabel.Length > 1 ? 
            fieldLabel[0].ToString().ToUpper() + fieldLabel.Substring(1)
            : "" : "";
        return String.Format(FieldXIsRequired, l);
    }
}