using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for LcUrl
/// </summary>
public class LcUrl
{
    public LcUrl()
    {
        //
        // TODO: Add constructor logic here
        //
    }
    
    /// <summary>
    /// Get the Lang Identifier for URL.
    /// Example: en-US, es-ES
    /// </summary>
    public static string LangId
    {
        get
        {
            return System.Globalization.CultureInfo.CurrentUICulture.Name;
        }
    }
}