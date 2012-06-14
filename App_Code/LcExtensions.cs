using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

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
}