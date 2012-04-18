using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net.Mail;
using System.Net;
using System.Web.Caching;
using System.Web.Helpers;

/// <summary>
/// Schedules an email to be sended after the delayTime especified.
/// 
/// TODO: at the moment there is no fallback security, if the server stops or crashs for some reason
/// the info might be lost, the event should be also stored in DDBB for manual/automated recovery
/// in case of system failure.
/// </summary>
public static class ReviewScheduling
{
    /// <summary>
    /// Schedules an email to be sended after the delayTime especified.
    /// Technically, this method create a Cache event that expires after 3h, sending the email after that.
    /// </summary>
    /// <param name="delayTime"></param>
    /// <param name="emailto"></param>
    /// <param name="emailsubject"></param>
    /// <param name="emailbody"></param>
    public static bool ScheduleEmail(TimeSpan delayTime, string emailto, string emailsubject, string emailbody)
    {
        try
        {
            HttpContext.Current.Cache.Insert("ReviewEmail: " + emailsubject,
                new Dictionary<string, string>()
                {
                    { "emailto", emailto },
                    { "emailsubject", emailsubject },
                    { "emailbody", emailbody }
                },
                null,
                System.Web.Caching.Cache.NoAbsoluteExpiration, delayTime,
                CacheItemPriority.Normal,
                new CacheItemRemovedCallback(CacheItemRemovedCallback));

            return true;
        }
        catch
        {
            return false;
        }
    }
    /// <summary>
    /// Cache Callback that Sends the email
    /// </summary>
    /// <param name="key"></param>
    /// <param name="value"></param>
    /// <param name="reason"></param>
    static void CacheItemRemovedCallback(string key, object value, CacheItemRemovedReason reason)
    {
        try
        {
            Dictionary<string, string> emaildata = (Dictionary<string, string>)value;

            string emailto = emaildata["emailto"];
            string body = emaildata["emailbody"]; //"This is a test e-mail message sent using loconomics as a relay server ";
            string subject = emaildata["emailsubject"]; //"Loconomics test email";

            WebMail.Send(emailto, subject, body);
        }
        catch (Exception ex)
        {
            HttpContext.Current.Trace.Warn("ReviewScheduling.ScheduleEmail=>CacheItemRemovedCallback Error: " + ex.ToString());
        }
    }
}