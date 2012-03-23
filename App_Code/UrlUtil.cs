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
    /// Example: http://www.loconomics.com
	/// </summary>
	/// <returns></returns>
    public static string SiteUrl
    {
        get
        {
            HttpContext context = HttpContext.Current;
            string baseUrl = context.Request.Url.Scheme + "://" + context.Request.Url.Authority;
            return baseUrl;
        }
    }
    /// <summary>
	/// Get the current virtual app path, will be empty for root app.
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
    /// Example: http://www.loconomics.com/beta/
	/// </summary>
	/// <returns></returns>
    public static string AppUrl{
        get
        {
            return SiteUrl + AppPath;
        }
    }
}
