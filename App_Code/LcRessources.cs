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
    };
    public static string GetText(string key) {
        if (textress.ContainsKey(key))
            return textress[key];
        return key;
    }
}