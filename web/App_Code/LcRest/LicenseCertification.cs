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
        public int languageID;
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
                languageID = record.languageID
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetItem = @"         
            DECLARE @licensecertificationID AS int
            SET @licensecertificationID = @0       
            DECLARE @languageID AS int
            SET @languageID = @1 
                       
        	SELECT  
        		licenseCertificationID
                ,LicenseCertificationType as name
                ,LicenseCertificationTypeDescription as description
                ,LicenseCertificationAuthority as authority
                ,verificationWebsiteUrl
                ,howToGetLicensedUrl
                ,createdDate
                ,updatedDate
                ,languageID
            FROM
                licensecertification                                 
            WHERE
                licensecertificationID = @licensecertificationID
                 AND 
                languageID = @languageID 
                 AND
                active=1
        ";
        #endregion

        public static LicenseCertification GetItem(int licenseCertificationID, int languageID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, licenseCertificationID, languageID));
            }
        }
        #endregion

    }
}