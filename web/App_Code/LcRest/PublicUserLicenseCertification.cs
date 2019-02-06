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
        public int userLicenseCertificationID;
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
        public string language;
        #endregion

        #region Link
        public LicenseCertification licenseCertification;

        public void FillLicenseCertification()
        {
            licenseCertification = LicenseCertification.GetItem(licenseCertificationID, language);
        }
        #endregion
        #region Instances
        public PublicUserLicenseCertification() { }

        public static PublicUserLicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            var item = new PublicUserLicenseCertification
            {           
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                userLicenseCertificationID = record.userLicenseCertificationID,
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
                language = record.language
            };
            item.FillLicenseCertification();
            return item;
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"            
            DECLARE @ProviderUserID AS int
            SET @ProviderUserID = @0         
            DECLARE @PositionID AS int
            SET @PositionID = @1   
            DECLARE @language AS nvarchar(42)
            SET @language = @2  
                       
            SELECT               
                V.ProviderUserID As userID
                ,V.PositionID As jobTitleID
                ,V.userLicenseCertificationID
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
                ,@language as language
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
                VS.Language = @language
                AND 
                V.VerificationStatusID = 1 
                AND
                V.expirationDate >= getdate()
        ";
        #endregion

        public static IEnumerable<PublicUserLicenseCertification> GetList(int userID, int jobTitleID, string language)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID, language).Select(FromDB);
            }
        }
        #endregion
    }
}