using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// LicenseCertification
    /// </summary>
    public class LicenseCertification
    {
        #region Fields
        public int licenseCertificationID;
        public string name;
        public string description;
        public string authority;
        public string verificationWebsiteUrl;
        public string howToGetLicensedUrl;
        public DateTime createdDate;
        public DateTime updatedDate;
        public string language;
        #endregion

        #region Instances
        public LicenseCertification() {}

        public static LicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new LicenseCertification
            {
                licenseCertificationID = record.licenseCertificationID,
                name = record.name,
                description = record.description,
                authority = record.authority,
                verificationWebsiteUrl = record.verificationWebsiteUrl,
                howToGetLicensedUrl = record.howToGetLicensedUrl,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                language = record.language
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetItem = @"         
            DECLARE @licensecertificationID AS int
            SET @licensecertificationID = @0       
            DECLARE @language AS nvarchar(42)
            SET @language = @1
                       
        	SELECT  
        		licenseCertificationID
                ,LicenseCertificationType as name
                ,LicenseCertificationTypeDescription as description
                ,LicenseCertificationAuthority as authority
                ,verificationWebsiteUrl
                ,howToGetLicensedUrl
                ,createdDate
                ,updatedDate
                ,language
            FROM
                licensecertification                                 
            WHERE
                licensecertificationID = @licensecertificationID
                 AND 
                language = @language
                 AND
                active=1
        ";
        #endregion

        public static LicenseCertification GetItem(int licenseCertificationID, string language)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, licenseCertificationID, language));
            }
        }
        #endregion

    }
}