using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Web.WebPages.Html;

/// <summary>
/// Collection of extensions useful for implementation
/// of a RESTful API
/// </summary>
public static class RESTExtensions
{
    public static IEnumerable ErrorsDictionary(this ModelStateDictionary modelState)
    {
        if (!modelState.IsValid)
        {
            return modelState.ToDictionary(kvp => kvp.Key,
                kvp => kvp.Value.Errors
                                .Select(e => e)).ToArray()
                                .Where(m => m.Value.Count() > 0);
        }
        return null;
    }

    public static IEnumerable Errors(this ModelStateDictionary modelState)
    {
        var errors = new Hashtable();
        foreach (var pair in modelState)
        {
            if (pair.Value.Errors.Count > 0)
            {
                errors[pair.Key] = pair.Value.Errors.ToList();
            }
        }
        return errors;
    }
}