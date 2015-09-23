using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// PublicUserJobTitle
    /// </summary>
    public class PublicUserJobTitle
    {
        #region Fields
        public int userID;
        public int jobTitleID;
        public string intro;
        public int cancellationPolicyID = CancellationPolicy.DefaultCancellationPolicyID;
        public bool instantBooking;
        public string jobTitleSingularName;
        public string jobTitlePluralName;
        #endregion

        #region Instances
        public PublicUserJobTitle() { }

        public static PublicUserJobTitle FromDB(dynamic record)
        {
            if (record == null) return null;

            return new PublicUserJobTitle
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                intro = record.intro,
                cancellationPolicyID = record.cancellationPolicyID ?? CancellationPolicy.DefaultCancellationPolicyID,
                instantBooking = record.instantBooking,
                jobTitleSingularName = record.jobTitleSingularName,
                jobTitlePluralName = record.jobTitlePluralName
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlSelectFromCommonWhere = @"
            SELECT
                u.userID As userID,
                u.PositionID As jobTitleID,
                u.PositionIntro As intro,
                u.CancellationPolicyID As cancellationPolicyID,
                u.InstantBooking As instantBooking,
                positions.PositionSingular As jobTitleSingularName,
                positions.PositionPlural As jobTitlePluralName
            FROM
                userprofilepositions as u
                    INNER JOIN
                positions on u.positionID = positions.positionID AND positions.languageID = @1 and positions.countryID = @2
            WHERE
                u.UserID = @0
                    AND u.LanguageID = @1
                    AND u.CountryID = @2
                    AND u.Active = 1
                    AND u.StatusID = 1 -- Only active/enabled positions
                    -- Double check for approved positions
                    AND positions.Active = 1
                    AND (positions.Approved = 1 Or positions.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        ";
        const string sqlAndJobTitleID = " AND @3 = u.PositionID ";
        const string sqlGetItem = sqlSelectFromCommonWhere + sqlAndJobTitleID;
        const string sqlGetList = sqlSelectFromCommonWhere;
        #endregion

        public static PublicUserJobTitle Get(int serviceProfessionalUserID, int languageID, int countryID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, serviceProfessionalUserID, languageID, countryID, jobTitleID));
            }
        }

        public static IEnumerable<PublicUserJobTitle> GetList(int serviceProfessionalUserID, int languageID, int countryID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, serviceProfessionalUserID, languageID, countryID)
                .Select<dynamic, PublicUserJobTitle>(FromDB);
            }
        }
        #endregion
    }
}
