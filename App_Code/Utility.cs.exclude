using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcCommonLib
{
    /// <summary>
    /// Summary description for Utility
    /// </summary>
    public class Utility
    {
        public static string ConfigGet(string key, string Default, bool unescape, IConfigManager configMgr)
        {
            if (configMgr == null)
                configMgr = new LcCommonLib.ConfigManager();

            return (configMgr.get(key, Default, unescape));
        }

        public static string ConfigGet(string key, string Default, IConfigManager configMgr)
        {
            if (configMgr == null)
                configMgr = new LcCommonLib.ConfigManager();

            return (configMgr.get(key, Default));
        }

        public static string ConfigGet(string key, IConfigManager configMgr)
        {
            if (configMgr == null)
                configMgr = new LcCommonLib.ConfigManager();

            return (configMgr.get(key));
        }

        public static string ensureGuid(string item)
        {
            string returnvalue = item;
            try
            {
                //attempts to load the string into a Guid object, which throws an
                //exception if it fails
                Guid g = new Guid(item);
            }
            catch
            {
                returnvalue = new Guid().ToString();
                //creates a zero valued guid "00000000-0000-0000-0000-000000000000"
            }
            return returnvalue;
        }

        public static int ensureInt(string item)
        {
            int returnvalue = 0;

            int result;
            if(int.TryParse(item, out result))
            {
                returnvalue = result;
            }

            return returnvalue;
        }


        public static Int64 ensureInt64(string item)
        {
            Int64 returnvalue = 0;

            Int64 result;
            if (Int64.TryParse(item, out result))
            {
                 returnvalue = result;
            }

            return returnvalue;
        }


        public static DateTime ensureDateTime(string item)
        {
            DateTime returnvalue = DateTime.MinValue;

            DateTime result;
            if (DateTime.TryParse(item, out result))
            {
                returnvalue = result;
            }

            return returnvalue;
        }

        public static string ensureDateTimeKeep(string item)
        {
            string returnvalue = DateTime.MinValue.ToString();

            DateTime result;
            if (DateTime.TryParse(item, out result))
            {
                returnvalue = item;
            }

            return returnvalue;
        }

        public static bool ensureBool(string item)
        {
            bool returnvalue = false;

            bool result;
            if (bool.TryParse(item, out result))
            {
                returnvalue = result;
            }

            return returnvalue;
        }
    }
}