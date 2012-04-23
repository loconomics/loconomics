using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcCommonLib
{
    /// <summary>
    /// This interface wrapper facilitates automated unit testing
    /// </summary>
    public interface IConfigManager
    {
        string get(string key);
        string get(string key, string Default);
        string get(string key, string Default, bool unescape);
    }

    /// <summary>
    /// these Try catch blocks prevent exceptions from occuring if the config key is missing
    /// </summary>
    public class ConfigManager: IConfigManager
    {
        public string get(string key)
        {
            return get(key, string.Empty, false);
        }

        public string get(string key, string Default)
        {
            return get(key, Default, false);
        }

        public string get(string key, string Default, bool unescape)
        {
            string returnvalue = Default;
            try
            {
                returnvalue = System.Configuration.ConfigurationManager.AppSettings.Get(key);
                if (unescape)
                {
                    returnvalue = returnvalue.Replace("&amp;", "&");
                    returnvalue = returnvalue.Replace("&lt;", "<");
                    returnvalue = returnvalue.Replace("&gt;", ">");
                }
            }
            catch { }
            return returnvalue;
        }
    }
}