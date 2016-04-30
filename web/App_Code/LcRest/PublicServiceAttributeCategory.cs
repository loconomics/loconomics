using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Abbreviated, public version of ServiceAttributeCategory, used to show
    /// informative information about a category in the public API, mostly when
    /// listing another user profile service attributes.
    /// That's means that fiels only interesting when editing or for service proffessionals
    /// are out of this class.
    /// The FromDB method is optimized for large field names so can be used with SQLs
    /// that retrieve mixed categories&attributes information without naming collision.
    /// </summary>
    public class PublicServiceAttributeCategory
    {
        #region Fields
        public int serviceAttributeCategoryID;
        public string name;
        public string description;
        #endregion

        #region Links
        public IEnumerable<ServiceAttribute> serviceAttributes;
        #endregion

        #region Instances
        public PublicServiceAttributeCategory() { }

        /// <summary>
        /// Creates an instance from a database record.
        /// It's optimized for large field names so can be used with SQLs
        /// that retrieve mixed categories&attributes information without naming collision.
        /// </summary>
        /// <param name="record"></param>
        /// <returns></returns>
        public static PublicServiceAttributeCategory FromDB(dynamic record, IEnumerable<dynamic> list = null)
        {
            var cat = new PublicServiceAttributeCategory
            {
                serviceAttributeCategoryID = record.serviceAttributeCategoryID,
                name = record.serviceAttributeCategoryName,
                description = record.serviceAttributeCategoryDescription
            };

            if (list != null) {
                cat.serviceAttributes = list.Select(ServiceAttribute.FromDB);
            }

            return cat;
        }
        #endregion
    }
}