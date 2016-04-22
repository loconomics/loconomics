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
    public class JobTitleStateProvinceLicense
    {
        #region Fields
        public int jobTitleID;
        public int licenseCertificationID;
        public bool required;
        public int stateProvinceID;
        public string stateProvinceName;
        public int languageID;
        #endregion

        #region Link
        public LicenseCertification licenseCertification;

        public void FillLicenseCertification()
        {
            licenseCertification = LicenseCertification.GetItem(licenseCertificationID, languageID);
        }
        #endregion
            
        #region Instances
        public JobTitleStateProvinceLicense() { }

        public static JobTitleStateProvinceLicense FromDB(dynamic record)
        {
            if (record == null) return null;
            var item = new JobTitleStateProvinceLicense
            {   
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                required = record.required,
                stateProvinceID = record.stateProvinceID,
                stateProvinceName = record.stateProvinceName,
                languageID = record.languageID
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
                ,JL.stateProvinceID
                ,SP.stateProvinceName
                ,@languageID as languageID
            FROM
                jobTitleLicense JL
                INNER JOIN
                StateProvince SP
                ON JL.stateProvinceID = SP.stateProvinceID
            WHERE
                positionID = @jobTitleID
                AND SP.stateProvinceID in ((SELECT
                P.stateProvinceID
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
                AND P.stateProvinceID not in ('0','-1')
            GROUP BY
                P.stateProvinceID))
        ";
        #endregion

        public static IEnumerable<JobTitleStateProvinceLicense> GetList(int userID, int jobTitleID, int languageID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID, languageID).Select(FromDB);
            }
        }
        #endregion

    }
}