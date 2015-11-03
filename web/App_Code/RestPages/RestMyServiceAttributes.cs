using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.WebData;
using System.Web.WebPages;
using ASP;
using WebMatrix.Data;

public class RestMyServiceAttributes : RestWebPage
{
    /// <summary>
    /// Retrieve the user attribute IDs by jobTitle and grouped by categoryID
    /// </summary>
    /// <returns></returns>
    public override dynamic Get()
    {
        if (UrlData.Count == 1 && UrlData[0].IsInt())
        {
            // Parameters
            int userId = WebSecurity.CurrentUserId;
            var jobTitleID = UrlData[0].AsInt();
            var locale = LcRest.Locale.Current;

            return LcRest.UserJobTitleServiceAttributes.Get(userId, jobTitleID, locale.languageID, locale.countryID);
        }

        // DOUBT: API to filter by categoryID too? /jobTitleID/categoryID and get only array if serviceAttributeIDs??

        return base.Get();
    }

    /// <summary>
    /// Receive an updated list of attributes by category
    /// in the same format than the basic Get result to replace current collections.
    /// The text key template 'serviceAttributes[{categoryID}]' is used to 
    /// receive the data in 'form urlencoded' format (Request.Form).
    /// Other data included in the same way as the resulting object (experienceLevelID)
    /// Additionally, the List of attributes can include text values for newly proposed attributes,
    /// when the current ones does not fills all the user needs. They are registered automatically
    /// but pending of internal approval.
    /// </summary>
    /// <returns></returns>
    public override dynamic Put()
    {
        if (UrlData.Count == 1 && UrlData[0].IsInt())
        {
            // Get data
            var data = GetInputData();
            // Set automatic data
            data.userID = WebSecurity.CurrentUserId;
            data.jobTitleID = UrlData[0].AsInt();
            var locale = LcRest.Locale.Current;
            data.languageID = locale.languageID;
            data.countryID = locale.countryID;

            LcRest.UserJobTitleServiceAttributes.Set(data);

            // Return the updated list
            return Get();
        }

        return base.Put();
    }

    private LcRest.UserJobTitleServiceAttributes GetInputData()
    {
        var data = new LcRest.UserJobTitleServiceAttributes();
        data.serviceAttributes = new Dictionary<int, List<int>>();
        data.proposedServiceAttributes = new Dictionary<int, List<string>>();

        // Attributes
        var reg = new System.Text.RegularExpressions.Regex(@"^serviceAttributes\[([^\]]+)\]", System.Text.RegularExpressions.RegexOptions.ECMAScript);
        foreach (var key in Request.Form.AllKeys)
        {
            var match = reg.Match(key);
            if (match.Success)
            {
                var catID = match.Groups[1].Value.AsInt();
                // Get attributes IDs from the list (avoid any '0' or non positive integer value)
                var values = Request.Form.GetValues(key);
                if (values != null)
                {
                    var atts = values.Select(x => x.AsInt(0)).Where(x => x > 0).ToList();
                    if (atts.Count > 0)
                    {
                        data.serviceAttributes.Add(catID, atts);
                    }
                    // Get attributes NAMEs from the list, for new proposed attributes
                    var attNames = values.Where(x => !x.IsInt()).ToList();
                    if (attNames.Count > 0)
                    {
                        data.proposedServiceAttributes.Add(catID, attNames);
                    }
                }
            }
        }

        // Experience level
        data.experienceLevelID = Request.Form["experienceLevelID"].AsInt(0);

        return data;
    }
}