using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Web;
using System.Web.Mvc;

namespace iCalendarToGoogle.Helpers
{
    public class UserInfo
    {
        public string UserId
        {
            get
            {
                return NumUserId.ToString();
            }
        }
        public string Name { set; get; }
        public int NumUserId { set; get; }

    }

    public class CultureData
    {
        public string Culture { set; get; }
        public string CultureName { set; get; }
        public bool IsValid { set; get; }
        public bool IsSelected { set; get; }

        public CultureData(string culture, string name, bool isvalid)
        {
            Culture = culture;
            CultureName = name;
            IsValid = IsValid;
        }
    }

    public static class Cultures
    {
        private static List<CultureData> cultures = new List<CultureData>();
        static Cultures()
        {
            cultures.Add(new CultureData("es-ES", "Español", true));
            cultures.Add(new CultureData("en-US", "English", true));

        }
        public static IEnumerable<SelectListItem> GetCultures()
        {
            return cultures.Select(c => new SelectListItem() { Value = c.Culture, Text = c.CultureName, Selected = c.IsSelected });
        }

        public static Dictionary<string, bool> GetCulturesDictionary()
        {
            return cultures.ToDictionary(c => c.Culture, c => c.IsValid);
        }

        public static void SelectCurrentCulture(string CurrentLanguage)
        {
            foreach (var c in cultures) c.IsSelected = false;
            var culture = cultures.FirstOrDefault(c => c.Culture == CurrentLanguage);
            if (culture != null) culture.IsSelected = true;
        }

    }

    public static class CultureHelper
    {

        /// <summary>
        /// set culture evaluation "laguage" param
        /// </summary>
        /// 
        public static string SetCulture(string language)
        {
            var CurrentLanguage = string.Empty;
            var culturename = Thread.CurrentThread.CurrentCulture.Name;
            var cookie = HttpContext.Current.Request.Cookies["_culture"];

            if (!string.IsNullOrEmpty(language) && culturename != language)
            {
                CurrentLanguage = GetValidCulture(language);

                //cass: Save culture in a cookie
                if (cookie != null) cookie.Value = CurrentLanguage;
                else cookie = new HttpCookie("_culture") { Value = CurrentLanguage, Expires = DateTime.Now.AddYears(1) };
            }
            else
            {
                if (cookie != null) CurrentLanguage = cookie.Value;
                else
                {
                    //cass: obtain it from HTTP header AcceptLanguages
                    CurrentLanguage = GetDefaultCulture(HttpContext.Current.Request.UserLanguages[0]);
                    cookie = new HttpCookie("_culture") { Value = CurrentLanguage, Expires = DateTime.Now.AddYears(1) };
                }
            }
            //cass: Adding Cookie Data
            HttpContext.Current.Response.Cookies.Add(cookie);


            //cass: Modify current thread's culture    

            if (culturename != language)
            {
                Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(CurrentLanguage);
                Thread.CurrentThread.CurrentUICulture = CultureInfo.CreateSpecificCulture(CurrentLanguage);
            }

            //cass: change culture selection
            Cultures.SelectCurrentCulture(CurrentLanguage);

            return CurrentLanguage;
        }

        // Include ONLY cultures you are implementing as views
        private static readonly Dictionary<String, bool> _cultures = Cultures.GetCulturesDictionary();


        /// <summary>
        /// Returns a valid culture name based on "name" parameter. If "name" is not valid, it returns the default culture "en-US"
        /// </summary>
        /// <param name="name">Culture's name (e.g. en-US)</param>
        public static string GetValidCulture(string name)
        {
            if (string.IsNullOrEmpty(name))
                return GetDefaultCulture(); // return Default culture

            if (_cultures.ContainsKey(name))
                return name;

            // Find a close match. For example, if you have "en-US" defined and the user requests "en-GB", 
            // the function will return closes match that is "en-US" because at least the language is the same (ie English)            
            foreach (var c in _cultures.Keys)
                if (c.StartsWith(name.Substring(0, 2)))
                    return c;


            // else             
            return GetDefaultCulture(); // return Default culture as no match found
        }


        /// <summary>
        /// Returns default culture name which is the first name decalared (e.g. en-US)
        /// </summary>
        /// <returns></returns>
        public static string GetDefaultCulture(string culturename)
        {
            var currentCulture = Thread.CurrentThread.CurrentCulture.Name;

            foreach (var c in _cultures.Keys)
                if (c.StartsWith(currentCulture.Substring(0, 2)))
                    return c;

            return _cultures.Keys.ElementAt(0); // return Default culture

        }

        public static string GetDefaultCulture()
        {
            return _cultures.Keys.ElementAt(0); // return Default culture

        }


        /// <summary>
        ///  Returns "true" if view is implemented separatley, and "false" if not.
        ///  For example, if "es-CL" is true, then separate views must exist e.g. Index.es-cl.cshtml, About.es-cl.cshtml
        /// </summary>
        /// <param name="name">Culture's name</param>
        /// <returns></returns>
        public static bool IsViewSeparate(string name)
        {
            return _cultures[name];
        }

    }

}
