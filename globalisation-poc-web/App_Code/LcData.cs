using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for LcData
/// </summary>
public class LcData
{
    public LcData()
    {
        //
        // TODO: Add constructor logic here
        //
    }

    #region l18n
    /// <summary>
    /// Based on LcUrl.LangId (string with format en-US, es-ES,..)
    /// returns the integer ID on database for the language part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentLanguageID()
    {
        switch (LcUrl.LangId.Substring(0, 2).ToUpper())
        {
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                // English as default
                return 1;
        }
    }
    /// <summary>
    /// Based on LcUrl.LangId (string with format en-US, es-ES,..)
    /// returns the integer ID on database for the country part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentCountryID()
    {
        switch (LcUrl.LangId.Substring(3, 2).ToUpper())
        {
            case "US":
            case "GB":
            case "EN":
                return 1;
            case "ES":
                return 2;
            case "AU":
                return 3;
            default:
                // USA as default
                return 1;
        }
    }
    #endregion
}