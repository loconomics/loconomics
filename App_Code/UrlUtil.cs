using System;
using System.Collections.Generic;
using System.Web;

/// <summary>
/// Url Utilities
/// </summary>
public static class UrlUtil
{
    /// <summary>
	/// Get the Site Root Url of the current request.
    /// Never will return a trailing slash.
    /// Example: http://www.loconomics.com
	/// </summary>
	/// <returns></returns>
    public static string SiteUrl
    {
        get
        {
            HttpContext context = HttpContext.Current;
            return context.Request.Url.Scheme + "://" + context.Request.Url.Authority;
        }
    }
    /// <summary>
	/// Get the current virtual app path, will be empty for root app.
    /// Ever will return a begining and trailing slash (or unique slash if there is no path)
    /// Example: /beta/ or /
	/// </summary>
	/// <returns></returns>
    public static string AppPath
    {
        get
        {
            HttpContext context = HttpContext.Current;
            string url = context.Request.ApplicationPath;
            if (url.EndsWith("/"))
                return url;
            else
                return url + "/";
        }
    }
    /// <summary>
	/// Get the current virtual app url, is just the SiteUrl with the AppPath
    /// Ever will return a trailing slash
    /// Example: http://www.loconomics.com/beta/
	/// </summary>
	/// <returns></returns>
    public static string AppUrl{
        get
        {
            return SiteUrl + AppPath;
        }
    }
    /// <summary>
	/// Get the current virtual app path plus the language path
    /// Ever will return a begining and trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string LangPath{
        get
        {
            return AppPath + LangId + "/";
        }
    }
    /// <summary>
	/// Get the current virtual app url plus the language path
    /// Ever will return a trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string LangUrl{
        get
        {
            return AppUrl + LangId + "/";
        }
    }
    /// <summary>
    /// Get the Lang Identifier in URL format.
    /// Example: en_US, es_ES
    /// </summary>
    public static string LangId
    {
        get
        {
            return System.Globalization.CultureInfo.CurrentUICulture.Name.Replace('-', '_');
        }
    }
    /// <summary>
    /// Returns a Json string with all the static data included in this class.
    /// Util to use from javascript code.
    /// </summary>
    /// <returns></returns>
    public static string ToJson()
    {
        var d = new Dictionary<string, string>(){
            { "SiteUrl", SiteUrl },
            { "AppPath", AppPath },
            { "AppUrl", AppUrl },
            { "LangPath", LangPath },
            { "LangUrl", LangUrl },
            { "LangId", LangId }
        };
        return System.Web.Helpers.Json.Encode(d);
    }
}
