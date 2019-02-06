using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// ServiceAttributes by categories attached to user job titles
    /// </summary>
    public class ServiceAttribute
    {
        #region Fields
        public int serviceAttributeID;
        public string name;
        public string description;
        #endregion

        #region Instances
        public ServiceAttribute() { }

        public static ServiceAttribute FromDB(dynamic record)
        {
            return new ServiceAttribute
            {
                serviceAttributeID = record.serviceAttributeID,
                name = record.name,
                description = record.description
            };
        }
        #endregion

        #region Fetch
        const string sqlGetUserList = @"
	        DECLARE @PositionID int
	        -- CategoryID can be Zero (0) to retrieve all attributes without regarding the category
	        DECLARE @ServiceAttributeCategoryID int
	        DECLARE @Language nvarchar(42)
	        DECLARE @UserID int = 0

            SET @PositionID = @0
            SET @ServiceAttributeCategoryID = @1
            SET @Language = @2
            SET @UserID = @3

            SELECT 
                se.serviceAttributeCategoryID,
                se.ServiceAttributeCategory as serviceAttributeCategoryName,
                se.ServiceAttributeCategoryDescription as serviceAttributeCategoryDescription,

                s.ServiceAttributeDescription as description,
                s.serviceAttributeID,
                s.name
            FROM servicecategorypositionattribute d
                JOIN serviceattribute s 
                 ON d.ServiceAttributeID = s.ServiceAttributeID 
                JOIN serviceattributecategory se 
                 ON d.ServiceAttributeCategoryID = se.ServiceAttributeCategoryID 
                    and d.Language = se.Language
                    and se.Language = s.Language

                INNER JOIN userprofileserviceattributes as us
                 ON d.ServiceAttributeID = us.ServiceAttributeID
                    and d.ServiceAttributeCategoryID = us.ServiceAttributeCategoryID
                    and d.PositionID = us.PositionID
                    and d.Language = us.Language
                    and us.Active = 1
                    and us.UserID = @UserID

            WHERE  d.PositionID = @PositionID  
                -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
                and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
                and d.Language  = @Language
                -- only actived
                and d.Active = 1
                and se.Active = 1
                and s.Active = 1
            ORDER BY s.DisplayRank ASC, s.Name ASC
        ";

        const string sqlGetJobTitleList = @"
	        DECLARE @PositionID int
	        -- CategoryID can be Zero (0) to retrieve all attributes without regarding the category
	        DECLARE @ServiceAttributeCategoryID int
	        DECLARE @Language nvarchar(42)

            SET @PositionID = @0
            SET @ServiceAttributeCategoryID = @1
            SET @Language = @2

            SELECT 
                se.serviceAttributeCategoryID,
                se.ServiceAttributeCategory as serviceAttributeCategoryName,
                se.ServiceAttributeCategoryDescription as serviceAttributeCategoryDescription,
                se.requiredInput,
                se.eligibleForPackages,

                s.ServiceAttributeDescription as description,
                s.serviceAttributeID,
                s.name
            FROM servicecategorypositionattribute d
                JOIN serviceattribute s 
                 ON d.ServiceAttributeID = s.ServiceAttributeID 
                JOIN serviceattributecategory se 
                 ON d.ServiceAttributeCategoryID = se.ServiceAttributeCategoryID 
                    and d.Language = se.Language
                    and se.Language = s.Language

            WHERE  d.PositionID = @PositionID  
                -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
                and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
                and d.Language = @Language
                -- only actived
                and d.Active = 1
                and se.Active = 1
                and s.Active = 1
            ORDER BY s.DisplayRank ASC, s.Name ASC
        ";

        const string sqlGetJobTitleReferenceCats = @"
            SELECT 
                se.serviceAttributeCategoryID,
                se.ServiceAttributeCategory as serviceAttributeCategoryName,
                se.ServiceAttributeCategoryDescription as serviceAttributeCategoryDescription,
                se.requiredInput,
                se.eligibleForPackages
            FROM serviceattributecategory se
            WHERE se.PositionReference = @0
                AND se.Language = @1
                AND se.Active = 1
        ";

        private static IEnumerable<dynamic> GetUserJobTitleListData(int userID, int jobTitleID, int serviceAttributeCategoryID, string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetUserList, jobTitleID, serviceAttributeCategoryID, language, userID);
            }
        }

        /// <summary>
        /// Get all service attributes assigned to the given userID and jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public static IEnumerable<PublicServiceAttributeCategory> GetGroupedUserJobTitleAttributes(int jobTitleID, int userID, string language)
        {
            return GetUserJobTitleListData(userID, jobTitleID, 0, language)
            .GroupBy(att => (int)att.serviceAttributeCategoryID, (k, l) => (PublicServiceAttributeCategory)PublicServiceAttributeCategory.FromDB(l.First(), l));
        }

        /// <summary>
        /// Get all service attributes IDs assigned to the given userID and jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public static Dictionary<int, List<int>> GetGroupedUserJobTitleAttributeIDs(int jobTitleID, int userID, string language)
        {
            return GetUserJobTitleListData(userID, jobTitleID, 0, language)
            .GroupBy(att => (int)att.serviceAttributeCategoryID, att => (int)att.serviceAttributeID)
            .ToDictionary(x => x.Key, x => x.ToList());
        }

        /// <summary>
        /// Get all service attributes assigned to the given jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public static IEnumerable<ServiceAttributeCategory> GetGroupedJobTitleAttributes(int jobTitleID, string language)
        {
            using (var db = new LcDatabase())
            {
                // Get all existent attributes
                var data = db.Query(sqlGetJobTitleList, jobTitleID, 0, language);

                // Get all existent attributes grouped by category
                var catAtts = data.GroupBy(att => (int)att.serviceAttributeCategoryID, (k, l) => (ServiceAttributeCategory)ServiceAttributeCategory.FromDB(l.First(), l));

                // But we still need to read all the categories that has no attributes still
                // and were assigned to the job-title using the special [PositionReference] field.
                var referenceCats = db.Query(sqlGetJobTitleReferenceCats, jobTitleID, language)
                    .Select<dynamic, ServiceAttributeCategory>(c => ServiceAttributeCategory.FromDB(c, new List<dynamic>())).ToList();
                // We iterate and return all the cats with attributes
                // while creating and index of IDs
                var indexCats = new List<int>();
                foreach (var cat in catAtts)
                {
                    yield return cat;
                    indexCats.Add(cat.serviceAttributeCategoryID);
                }
                // Return empty reference cats, all the ones not included in the generated index
                foreach (var cat in referenceCats)
                {
                    if (!indexCats.Contains(cat.serviceAttributeCategoryID))
                        yield return cat;
                }
            }
        }
        #endregion
    }
}