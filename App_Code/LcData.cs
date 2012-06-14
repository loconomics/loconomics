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
                    { "ServiceAttributeCategoryName", cat.ServiceCat }
                };
                // Getting attributes of the category
                rcat["ServiceAttributes"] = db.Query(sqlattribute, positionId, cat.ServiceAttributeCategoryID, (userId == 0 ? null : (object)userId));
                rcats.Add(cat.ServiceAttributeCategoryID, rcat);
            }
        }
        return rcats;
    }
}