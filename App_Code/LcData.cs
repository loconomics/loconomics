using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcData
/// </summary>
public static class LcData
{
    public static Dictionary<int, Dictionary<string, object>> GetServiceCatsAndItsAttributes(int positionId, string filter = null, int userId = 0)
    {
        var rcats = new Dictionary<int, Dictionary<string, object>>();
        var catsFilter = new List<int>();
        
        switch (filter) {
            case "provider-services":
                //catsFilter.AddRange(new int[]{1, 2, 3, 4, 5, 7});
                //catsFilter.AddRange(new int[]{1, 2, 4, 5, 7});
                break;
        }

        var sqlcat = "exec GetServiceAttributeCategories @0,1,1";
        var sqlattribute = "exec GetServiceAttributes @0,@1,1,1,@2";

        using (var db = Database.Open("sqlloco"))
        {
            var catrow = db.Query(sqlcat, positionId);

            // Iterate the categories
            foreach (var cat in catrow)
            {
                // Apply filtering, if there are
                if (catsFilter.Count > 0 && !catsFilter.Contains(cat.ServiceAttributeCategoryID))
                {
                    continue;
                }
                // Copy data to a new structure
                var rcat = new Dictionary<string, object>(){
                    { "ServiceAttributeCategoryID", cat.ServiceAttributeCategoryID },
                    { "ServiceAttributeCategoryName", cat.ServiceCat },
                    { "ServiceAttributeCategoryDescription", cat.ServiceAttributeCategoryDescription }
                };
                // Getting attributes of the category
                rcat["ServiceAttributes"] = db.Query(sqlattribute, positionId, cat.ServiceAttributeCategoryID, (userId == 0 ? null : (object)userId));
                rcats.Add(cat.ServiceAttributeCategoryID, rcat);
            }
        }
        return rcats;
    }
    /// <summary>
    /// Based on UrlUtil.LangId (string with format en_US, es_ES,..)
    /// returns the integer ID on database for the language part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentLanguageID()
    {
        switch (UrlUtil.LangId.Substring(0, 2).ToUpper())
        {
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                return 0;
        }
    }
    /// <summary>
    /// Based on UrlUtil.LangId (string with format en_US, es_ES,..)
    /// returns the integer ID on database for the country part
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentCountryID()
    {
        switch (UrlUtil.LangId.Substring(3, 2).ToUpper())
        {
            case "US":
            case "GB":
            case "EN":
                return 1;
            case "ES":
                return 2;
            default:
                return 0;
        }
    }

    public static int GetStateFromZipCode(string zipcode)
    {
        var sqlGetStateIDFromZipCode = @"
            SELECT TOP 1 StateProvinceID
            FROM    PostalCode As PC
            WHERE   PC.PostalCode = @0
                        AND
                    CountryID = @1
        ";
        using (var db = Database.Open("sqlloco"))
        {
            var stateID = db.QueryValue(sqlGetStateIDFromZipCode, zipcode, LcData.GetCurrentCountryID());
            return stateID == null ? 0 : (int)stateID;
        }
    }
}