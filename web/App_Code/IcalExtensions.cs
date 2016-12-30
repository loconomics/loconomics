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
            var rawContent = client.DownloadString(uri);
            return Calendar.LoadFromStream(new StringReader(rawContent)) as CalendarCollection;
        }
    }
}