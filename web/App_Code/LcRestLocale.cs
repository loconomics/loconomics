using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Represent the locale (language-country) used
/// in a REST API Request.
/// </summary>
public class LcRestLocale
{
    public string languageCode { get; private set; }
    public string countryCode { get; private set; }
    public int languageID { get; private set; }
    public int countryID { get; private set; }

    private LcRestLocale() { }

    public static string GetCountryCodeByID(int CountryID) {
        switch (CountryID)
        {
            case 1:
                return "US";
            case 2:
                return "ES";
            default:
                // US by default
                return "US";
        }
    }

    public static int GetCountryIDByCode(string CountryCode) {
        switch (CountryCode)
        {
            case "US":
                return 1;
            case "ES":
                return 2;
            default:
                // US by default
                return 1;
        }
    }

    public static string GetLanguageCodeByID(int LanguageID) {
        switch (LanguageID)
        {
            case 1:
                return "EN";
            case 2:
                return "ES";
            default:
                // EN by default
                return "EN";
        }
    }

    public static int GetLanguageIDByCode(string LanguageCode) {
        switch (LanguageCode)
        {
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                // EN by default
                return 1;
        }
    }

    public static LcRestLocale Current
    {
        get
        {
            // TODO: Reimplement when the URL for REST changes
            var locale = new LcRestLocale {
                countryID = LcData.GetCurrentCountryID(),
                languageID = LcData.GetCurrentLanguageID()
            };
            locale.countryCode = GetCountryCodeByID(locale.countryID);
            locale.languageCode = GetLanguageCodeByID(locale.languageID);

            return locale;
        }
    }
}