using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class PublicJobTitle
    {
        #region Fields
        public int jobTitleID;
        public string language;
        public string singularName;
        public string pluralName;
        public string aliases;
        public string description;
        public string searchDescription;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        #region Links
        public IEnumerable<JobTitlePricingType> pricingTypes;

        public void FillPricingTypes()
        {
            pricingTypes = JobTitlePricingType.GetList(jobTitleID, language);
        }
        #endregion

        #region Instances
        public static PublicJobTitle FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicJobTitle
            {
                jobTitleID = record.jobTitleID,
                singularName = record.singularName,
                pluralName = record.pluralName,
                aliases = record.aliases,
                description = record.description,
                searchDescription = record.searchDescription,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                language = record.language
            };
        }
        #endregion

        #region Fetch
        #region SQLs
        const string sqlGetItem = @"
            SELECT
                PositionID As jobTitleID,
                PositionSingular As singularName,
                PositionPlural As pluralName,
                Aliases As aliases,
                PositionDescription As description,
                PositionSearchDescription As searchDescription,
                CreatedDate As createdDate,
                UpdatedDate As updatedDate,
                language
            FROM
                positions
            WHERE
                PositionID = @0
                    AND Language = @1
                    AND Active = 1
                    AND (Approved = 1 Or Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        ";
        #endregion
        public static PublicJobTitle Get(int jobTitleID, string language)
        {
            using (var db = new LcDatabase())
            {
                var r = FromDB(db.QuerySingle(sqlGetItem, jobTitleID, language));
                if (r == null) return null;
                r.FillPricingTypes();
                return r;
            }
        }
        #endregion
    }
}