using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace LcRest
{
    /// <summary>
    /// User license certification
    /// </summary>
    public class JobTitleMunicipalLicense
    {
        #region Fields
        public int jobTitleID;
        public int licenseCertificationID;
        public bool required;
        public int municipalityID;
        public string municipalityName;
        public int languageID;
        public int submitted;
        public string optionGroup;
        #endregion

        #region Link
        public LicenseCertification licenseCertification;

        public void FillLicenseCertification()
        {
            licenseCertification = LicenseCertification.GetItem(licenseCertificationID, languageID);
        }
        #endregion
            
        #region Instances
        public JobTitleMunicipalLicense() { }

        public static JobTitleMunicipalLicense FromDB(dynamic record)
        {
            if (record == null) return null;
            var item = new JobTitleMunicipalLicense
            {   
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                required = record.required,
                municipalityID = record.municipalityID,
                municipalityName = record.municipalityName,
                languageID = record.languageID,
                submitted = record.submitted,
                optionGroup = record.optionGroup
            };
            item.FillLicenseCertification();
            return item;
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"  
            DECLARE @userID AS int
            SET @userID = @0       
            DECLARE @jobTitleID AS int
            SET @jobTitleID = @1    
            DECLARE @languageID AS int
            SET @languageID = @2
             
            SELECT
                JL.positionID as jobTitleID
                ,JL.licenseCertificationID
                ,JL.required
                ,JL.municipalityID
                ,M.municipalityName
                ,@languageID as languageID
                ,CASE WHEN UL.LicenseCertificationID = JL.LicenseCertificationID then 1 else 0 END as submitted 
                ,JL.optionGroup
            FROM
                jobTitleLicense JL
                INNER JOIN
                municipality M
                ON JL.MunicipalityID = M.MunicipalityID
                LEFT JOIN
                userLicenseCertifications UL
                ON JL.LicenseCertificationID = UL.LicenseCertificationID
                AND UL.ProviderUserID = @userID
            WHERE
                JL.positionID = @jobTitleID
                AND M.MunicipalityID in ((SELECT
                P.MunicipalityID
            FROM
                serviceaddress As SA
                 INNER JOIN
                address As A
                  ON A.AddressID = SA.AddressID
                 INNER JOIN
                postalcode As P
                ON A.PostalCodeID = P.PostalCodeID
            WHERE
                SA.UserID = @userID
                AND SA.PositionID = @jobTitleID
                AND JL.Active = 1
                AND P.MunicipalityID not in ('0','-1')
            GROUP BY
                P.MunicipalityID))
        ";
        #endregion

        public static IEnumerable<JobTitleMunicipalLicense> GetList(int userID, int jobTitleID, int languageID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID, languageID).Select(FromDB);
            }
        }
        #endregion

    }
}