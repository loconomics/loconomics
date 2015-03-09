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

    private static readonly System.Text.RegularExpressions.Regex regURLLocale =
        new System.Text.RegularExpressions.Regex(@"/api/v([^/]+)/([a-z]{2})-([A-Z]{2})(/|$)", 
            System.Text.RegularExpressions.RegexOptions.ECMAScript | System.Text.RegularExpressions.RegexOptions.Compiled);

    public static dynamic AnalyzeURL(string url)
    {
        var matches = regURLLocale.Match(url);
        if (matches.Success)
        {
            var version = matches.Groups[1].Value;
            var lang = matches.Groups[2].Value;
            var country = matches.Groups[3].Value;
            return new {
                version = version,
                language = lang,
                country = country
            };
        }
        return null;
    }

    public static LcRestLocale Current
    {
        get
        {
            var info = AnalyzeURL(HttpContext.Current.Request.RawUrl);

            if (info != null)
            {
                var locale = new LcRestLocale
                {
                    countryCode = info.country,
                    countryID = GetCountryIDByCode(info.country),
                    languageCode = info.language,
                    languageID = GetLanguageIDByCode(info.language)
                };

                return locale;
            }
            return null;
        }
    }
}