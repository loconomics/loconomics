using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;

/// <summary>
/// LcExtensions is a set of usefull classes extensions to use along all the Loconomics site
/// </summary>
public static class LcExtensions
{
    public static bool IsAjaxRequest(this HttpRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException("request");
        }
        return (request["X-Requested-With"] == "XMLHttpRequest") || ((request.Headers != null) && (request.Headers["X-Requested-With"] == "XMLHttpRequest"));
    }
    public static bool IsAjaxRequest(this HttpRequestBase request)
    {
        if (request == null)
        {
            throw new ArgumentNullException("request");
        }
        return (request["X-Requested-With"] == "XMLHttpRequest") || ((request.Headers != null) && (request.Headers["X-Requested-With"] == "XMLHttpRequest"));
    }
    public static Dictionary<string, object> ToJsonDictionary<TKey, TValue>(this Dictionary<TKey, TValue> input)
    {
	    var output = new Dictionary<string, object>(input.Count);
	    foreach (KeyValuePair<TKey, TValue> pair in input)
		    output.Add(pair.Key.ToString(), pair.Value);
	    return output;
        //return input.ToDictionary(item => item.Key.ToString(), item => item.Value);
    }

    public static string Capitalize(this String str)
    {
        if (str == null || str.Length < 1) return str;

        return (
            str[0].ToString().ToUpper() + 
            (str.Length > 1 ? str.Substring(1) : "")
        );
    }

    public static IEnumerable TopElements(this IEnumerable list, double limit)
    {
        double count = 0;
        foreach (var item in list) {
            if (count++ == limit)
                yield break;
            yield return item;
        }
    }

    public static TimeSpan AsTimeSpan(this String str)
    {
        return str.AsTimeSpan(TimeSpan.Zero);
    }
    public static TimeSpan AsTimeSpan(this String str, TimeSpan defaultValue)
    {
        var r = defaultValue;
        TimeSpan.TryParse(str, out r);
        return r;
    }

    public static string ToPascalCase(this String str)
    {
        if (str == null) return "";
        System.Globalization.TextInfo textInfo = System.Globalization.CultureInfo.CurrentUICulture.TextInfo;
        string result = textInfo.ToTitleCase(str.Trim().Replace("-", " ")).Replace(" ", "");
        return result;
    }
    public static string ToCamelCase(this String str)
    {
        if (str == null) return "";
        var result = str.ToPascalCase();
        if (result.Length > 1)
            result = result[0].ToString().ToLower() + result.Substring(1);
        return result;
    }
}