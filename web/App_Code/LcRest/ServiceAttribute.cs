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
	        DECLARE @LanguageID int = 1
	        DECLARE @CountryID int = 1
	        DECLARE @UserID int = 0

            SET @PositionID = @0
            SET @ServiceAttributeCategoryID = @1
            SET @LanguageID = @2
            SET @CountryID = @3
            SET @UserID = @4

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
                    and d.LanguageID = se.LanguageID
                    and d.CountryID = se.CountryID
                    and se.LanguageID = s.LanguageID
                    and se.CountryID = s.CountryID

                INNER JOIN userprofileserviceattributes as us
                 ON d.ServiceAttributeID = us.ServiceAttributeID
                    and d.ServiceAttributeCategoryID = us.ServiceAttributeCategoryID
                    and d.PositionID = us.PositionID
                    and d.LanguageID = us.LanguageID
                    and d.CountryID = us.CountryID
                    and us.Active = 1
                    and us.UserID = @UserID

            WHERE  d.PositionID = @PositionID  
                -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
                and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
                and d.LanguageID  = @LanguageID
                and d.CountryID = @CountryID
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
	        DECLARE @LanguageID int = 1
	        DECLARE @CountryID int = 1

            SET @PositionID = @0
            SET @ServiceAttributeCategoryID = @1
            SET @LanguageID = @2
            SET @CountryID = @3

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
                    and d.LanguageID = se.LanguageID
                    and d.CountryID = se.CountryID
                    and se.LanguageID = s.LanguageID
                    and se.CountryID = s.CountryID

            WHERE  d.PositionID = @PositionID  
                -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
                and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
                and d.LanguageID  = @LanguageID
                and d.CountryID = @CountryID
                -- only actived
                and d.Active = 1
                and se.Active = 1
                and s.Active = 1
            ORDER BY s.DisplayRank ASC, s.Name ASC
        ";

        private static IEnumerable<dynamic> GetUserJobTitleListData(int userID, int jobTitleID, int serviceAttributeCategoryID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetUserList, jobTitleID, serviceAttributeCategoryID, languageID, countryID, userID);
            }
        }

        private static IEnumerable<dynamic> GetJobTitleListData(int jobTitleID, int serviceAttributecategoryID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetJobTitleList, jobTitleID, serviceAttributecategoryID, languageID, countryID);
            }
        }

        /// <summary>
        /// Get all service attributes assigned to the given userID and jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<PublicServiceAttributeCategory> GetGroupedUserJobTitleAttributes(int jobTitleID, int userID, int languageID, int countryID)
        {
            return GetUserJobTitleListData(userID, jobTitleID, 0, languageID, countryID)
            .GroupBy(att => (int)att.serviceAttributeCategoryID, (k, l) => (PublicServiceAttributeCategory)PublicServiceAttributeCategory.FromDB(l.First(), l));
        }

        /// <summary>
        /// Get all service attributes IDs assigned to the given userID and jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static Dictionary<int, List<int>> GetGroupedUserJobTitleAttributeIDs(int jobTitleID, int userID, int languageID, int countryID)
        {
            return GetUserJobTitleListData(userID, jobTitleID, 0, languageID, countryID)
            .GroupBy(att => (int)att.serviceAttributeCategoryID, att => (int)att.serviceAttributeID)
            .ToDictionary(x => x.Key, x => x.ToList());
        }

        /// <summary>
        /// Get all service attributes assigned to the given jobTitleID
        /// in groups indexed by the serviceAttributeCategoryID.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="languageID"></param>
        /// <param name="countryID"></param>
        /// <returns></returns>
        public static IEnumerable<ServiceAttributeCategory> GetGroupedJobTitleAttributes(int jobTitleID, int languageID, int countryID)
        {
            return GetJobTitleListData(jobTitleID, 0, languageID, countryID)
            .GroupBy(att => (int)att.serviceAttributeCategoryID, (k, l) => (ServiceAttributeCategory)ServiceAttributeCategory.FromDB(l.First(), l));
        }
        #endregion
    }
}