using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// 
    /// </summary>
    public class PublicUserLicenseCertification
    {
        #region Fields
        public int userID;
        public int jobTitleID;
        public int licenseCertificationID;
        public string licenseCertificationNumber;
        public DateTime? expirationDate;
        public DateTime? lastVerifiedDate;
        #endregion

        #region Link
        public LicenseCertification licenseCertification;
        #endregion

        #region Instances
        public PublicUserLicenseCertification() { }

        public static PublicUserLicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserLicenseCertification
            {
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                expirationDate = record.expirationDate,
                lastVerifiedDate = record.lastVerifiedDate,

                licenseCertification = LicenseCertification.FromDB(record)
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"
            SELECT
                V.ProviderUserID As userID,
                V.PositionID As jobTitleID,
                V.licenseCertificationID,
                V.statusID,
                V.licenseCertificationNumber,
                V.licenseCertificationUrl,
                V.LicenseStatus As licenseCertificationStatus,
                V.expirationDate,
                V.issueDate,
                CY.countryCode,
                SP.stateProvinceCode,
                SP.stateProvinceName,
                C.countyName,
                V.city,
                V.firstName,
                V.lastName,
                V.secondLastName,
                V.middleInitial,
                V.actions,
                V.comments,
                V.verifiedBy,
                V.lastVerifiedDate,
                V.createdDate,
                V.modifiedDate as updatedDate,

                -- Added License fields in addition for 1 call load of all info
                L.LicenseCertificationType As name,
                L.LicenseCertificationTypeDescription As description,
                L.LicenseCertificationAuthority As authority,
                L.verificationWebsiteUrl,
                L.howToGetLicensedUrl,
                L.optionGroup
            FROM
                LicenseCertification As L
                 INNER JOIN
                userlicenseverification As V
                  ON L.LicenseCertificationID = V.LicenseCertificationID
                 INNER JOIN
                StateProvince As SP
                  ON L.StateProvinceID = SP.StateProvinceID
                 INNER JOIN
                County As C
                  ON C.CountyID = V.CountyID
                 INNER JOIN
                Country As CY
                  ON CY.CountryID = V.CountryID AND CY.LanguageID = 1
            WHERE
                V.ProviderUserID = @0
                 AND
                V.PositionID = @1
                 AND
                L.Active = 1
                 AND V.statusID = 1 -- ONLY confirmed ones
        ";
        #endregion

        public static IEnumerable<PublicUserLicenseCertification> GetList(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID).Select(FromDB);
            }
        }
        #endregion
    }
}