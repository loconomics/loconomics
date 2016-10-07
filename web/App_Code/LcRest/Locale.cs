using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Represent the locale (language-country) used
    /// in a REST API Request.
    /// </summary>
    public class Locale
    {
        public string languageCode { get; private set; }
        public string countryCode { get; private set; }
        public int languageID { get; private set; }
        public int countryID { get; private set; }

        private Locale() { }

        public override string ToString()
        {
            return languageCode.ToLower() + "-" + countryCode.ToUpper();
        }

        /// <summary>
        /// TODO Implement database look-up, throgh Country class
        /// </summary>
        /// <param name="CountryID"></param>
        /// <returns></returns>
        public static string GetCountryCodeByID(int CountryID)
        {
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

        /// <summary>
        /// TODO Implement database look-up, throgh Country class
        /// </summary>
        /// <param name="CountryCode"></param>
        /// <returns></returns>
        public static int GetCountryIDByCode(string CountryCode)
        {
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

        /// <summary>
        /// TODO Implement database look-up, throgh Language class
        /// </summary>
        /// <param name="LanguageID"></param>
        /// <returns></returns>
        public static string GetLanguageCodeByID(int LanguageID)
        {
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

        /// <summary>
        /// TODO Implement database look-up, throgh Language class
        /// </summary>
        /// <param name="LanguageCode"></param>
        /// <returns></returns>
        public static int GetLanguageIDByCode(string LanguageCode)
        {
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

        /// <summary>
        /// Detecting language in the URL.
        /// Using a generic pattern to check just a URL segment with language format.
        /// 
        /// For a specific REST API URL matching, use regRestUrlLocale
        /// </summary>
        private static readonly System.Text.RegularExpressions.Regex regUrlLocale =
            new System.Text.RegularExpressions.Regex(@"/([a-z]{2})-([A-Z]{2})(/|$)",
                System.Text.RegularExpressions.RegexOptions.ECMAScript | System.Text.RegularExpressions.RegexOptions.Compiled);

        public static dynamic AnalyzeUrl(string url)
        {
            var matches = regUrlLocale.Match(url);
            if (matches.Success)
            {
                var lang = matches.Groups[1].Value;
                var country = matches.Groups[2].Value;
                return new
                {
                    language = lang,
                    country = country
                };
            }
            return null;
        }

        private static readonly System.Text.RegularExpressions.Regex regRestUrlLocale =
            new System.Text.RegularExpressions.Regex(@"/api/v([^/]+)/([a-z]{2})-([A-Z]{2})(/|$)",
                System.Text.RegularExpressions.RegexOptions.ECMAScript | System.Text.RegularExpressions.RegexOptions.Compiled);

        public static dynamic AnalyzeRestUrl(string url)
        {
            var matches = regRestUrlLocale.Match(url);
            if (matches.Success)
            {
                var version = matches.Groups[1].Value;
                var lang = matches.Groups[2].Value;
                var country = matches.Groups[3].Value;
                return new
                {
                    version = version,
                    language = lang,
                    country = country
                };
            }
            return null;
        }

        public static Locale Current
        {
            get
            {
                var info = AnalyzeUrl(HttpContext.Current.Request.RawUrl);

                if (info != null)
                {
                    var locale = new Locale
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
}