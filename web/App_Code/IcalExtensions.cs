using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;
using System.IO;
using Ical.Net;

/// <summary>
/// 
/// </summary>
public static class IcalExtensions
{
    public static CalendarCollection LoadFromUri(Uri uri)
    {
        using (var client = new WebClient())
        {
            // Support for the 'webcal://' scheme, that actually is the 'http://' protocol and same default port (80)
            if (uri.Scheme.ToLower() == "webcal")
            {
                var fixedUri = System.Text.RegularExpressions.Regex.Replace(uri.ToString(), "^webcal:", "http:", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                uri = new Uri(fixedUri);
            }
            var rawContent = client.DownloadString(uri);
            return Calendar.LoadFromStream(new StringReader(rawContent)) as CalendarCollection;
        }
    }
}