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
        public string licenseCertificationUrl;
        public DateTime? expirationDate;
        public string firstName;
        public string lastName;
        public string middleInitial;
        public string businessName;
        public int statusID;
        public string status;
        public string statusDescription;
        public DateTime? lastVerifiedDate;
        public string submittedImageLocalURL;
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
        public PublicUserLicenseCertification() { }

        public static PublicUserLicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new PublicUserLicenseCertification
            {           
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                licenseCertificationNumber = record.licenseCertificationNumber,
                licenseCertificationUrl = record.licenseCertificationUrl,
                expirationDate = record.expirationDate,
                firstName = record.firstName,
                lastName = record.lastName,
                middleInitial = record.middleInitial,
                businessName = record.businessName,
                statusID = record.statusID,
                status = record.status,
                statusDescription = record.statusDescription,
                lastVerifiedDate = record.lastVerifiedDate,
                submittedImageLocalURL = record.submittedImageLocalURL,
                languageID = record.languageID
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"            
            DECLARE @ProviderUserID AS int
            SET @ProviderUserID = @0         
            DECLARE @PositionID AS int
            SET @PositionID = @1   
            DECLARE @languageID AS int
            SET @languageID = @2  
                       
            SELECT               
                V.ProviderUserID As userID
                ,V.PositionID As jobTitleID
                ,V.licenseCertificationID
                ,V.licenseCertificationNumber
                ,V.licenseCertificationUrl
                ,V.expirationDate
                ,V.firstName
                ,V.lastName
                ,V.middleInitial
                ,V.businessName
                ,V.VerificationStatusID as statusID
                ,VS.verificationStatusName as status
                ,VS.verificationStatusDisplayDescription as statusDescription
                ,V.lastVerifiedDate
                ,V.submittedImageLocalURL
                ,@languageID as languageID
            FROM
                userlicensecertifications As V
                 INNER JOIN
                verificationstatus As VS
                  ON V.VerificationStatusID = VS.VerificationStatusID                       
            WHERE
                V.ProviderUserID = @ProviderUserID
                 AND
                V.PositionID = @PositionID
                 AND 
                VS.LanguageID = @languageID 
                AND 
                V.VerificationStatusID = 1 
                AND
                V.expirationDate >= getdate()
        ";
        #endregion

        public static IEnumerable<PublicUserLicenseCertification> GetList(int userID, int jobTitleID, int languageID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID, languageID).Select(FromDB);
            }
        }
        #endregion
    }
}