using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;
using System.Web.WebPages.Html;
using WebMatrix.Data;
using System.Text.RegularExpressions;

/// <summary>
/// Descripción breve de LcValidators
/// </summary>
public static class LcValidators
{
    public const string EmailAddressRegexPattern = @"\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*";
    public static bool IsEmailAdress(string sEmail)
    {
        if (!String.IsNullOrWhiteSpace(sEmail))
        {
            var sRegex = new Regex(EmailAddressRegexPattern);
            return sRegex.IsMatch(sEmail) ? true : false;
        }
        else
        {
            return false;
        }
    }
    /// <summary>
    /// Read a list of email addresses from emails param, returning
    /// the list of emails or null if there is no emails or some email is not valid
    /// </summary>
    /// <param name="emails"></param>
    /// <returns></returns>
    public static string[] ReadEmailAddressList(string emails)
    {
        List<string> list = new List<string>();
        if (String.IsNullOrWhiteSpace(emails)) return null;
        var l = emails.Replace("\n", ",").Replace(";", ",").Split(new char[] {','}, StringSplitOptions.RemoveEmptyEntries);
        foreach (string email in l)
        {
            if (IsEmailAdress(email))
                list.Add(email);
            else
                return null;
        }
        return list.Count == 0 ? null : list.ToArray<string>();
    }

    public static bool IsUrl(string sUrl)
    {
        return System.Uri.IsWellFormedUriString(sUrl, UriKind.Absolute);
    }
}