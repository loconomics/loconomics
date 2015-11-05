using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    /// <summary>
    /// Represents a Service Attribute attached to a package
    /// </summary>
    [Obsolete("Not needed in new API, only used on old server-side UI")]
    public class PackageServiceAttribute
    {
        public int ID;
        public string Name;
        public string Description;
        public int ProviderPackageID;
        public PackageServiceAttribute()
        {
        }
        public PackageServiceAttribute(dynamic record)
        {
            this.ID = record.ServiceAttributeID;
            this.Name = record.Name;
            this.Description = record.ServiceAttributeDescription;
            this.ProviderPackageID = record.ProviderPackageID;
        }
        public static List<PackageServiceAttribute> ListFromDBRecords(dynamic records)
        {
            var list = new List<PackageServiceAttribute>();
            foreach(var record in records)
            {
                list.Add(new PackageServiceAttribute(record));
            }
            return list;
        }
        public static Dictionary<int, PackageServiceAttribute> DictionaryFromDBRecords(dynamic records)
        {
            var dict = new Dictionary<int, PackageServiceAttribute>();
            foreach(var record in records)
            {
                dict[record.ServiceAttributeID] = new PackageServiceAttribute(record);
            }
            return dict;
        }
        public static List<PackageServiceAttribute> ListFromPackageID(int packageID)
        {
            var list = new List<PackageServiceAttribute>();
            foreach(var record in LcData.GetProviderPackageServiceAttributes(packageID))
            {
                list.Add(new PackageServiceAttribute(record));
            }
            return list;
        }
        public static Dictionary<int, PackageServiceAttribute> DictionaryFromPackageID(int packageID)
        {
            var dict = new Dictionary<int, PackageServiceAttribute>();
            foreach(var record in LcData.GetProviderPackageServiceAttributes(packageID))
            {
                dict[record.ServiceAttributeID] = new PackageServiceAttribute(record);
            }
            return dict;
        }
    }
}