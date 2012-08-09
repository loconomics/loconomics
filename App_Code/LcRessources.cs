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
    public const string DataSaved = "Data was successfully saved";
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

        ,{ "postal-code-validation-error", "Postal Code is not valid" }
    };
    public static string GetText(string key) {
        if (textress.ContainsKey(key))
            return textress[key];
        return key;
    }
    public static string RequiredField(string fieldLabel) {
        var l = fieldLabel != null ? fieldLabel.Length > 1 ? 
            fieldLabel[0].ToString().ToUpper() + fieldLabel.Substring(1)
            : "" : "";
        return String.Format(FieldXIsRequired, l);
    }
}