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
    public class UserLicenseCertification
    {
        #region Fields
        public int userLicenseCertificationID;
        public int userID;
        public int jobTitleID;
        public int licenseCertificationID;
        public int statusID;
        public string licenseCertificationNumber;
        public string licenseCertificationUrl;
        public DateTime? expirationDate;
        public DateTime? issueDate;
        public string firstName;
        public string lastName;
        public string middleInitial;
        public string secondLastName;
        public string businessName;
        public string comments;
        public string verifiedBy;
        public DateTime? lastVerifiedDate;
        public DateTime submitDate;
        public string submittedBy;
        public string submittedImageLocalURL;
        public string status; 
        public string statusDescription; 
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
        public UserLicenseCertification() { }

        public static UserLicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            var item = new UserLicenseCertification
            {   userLicenseCertificationID = record.userLicenseCertificationID,
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                statusID = record.statusID,
                licenseCertificationNumber = record.licenseCertificationNumber,
                licenseCertificationUrl = record.licenseCertificationUrl,
                expirationDate = record.expirationDate,
                issueDate = record.issueDate,
                firstName = record.firstName,
                lastName = record.lastName,
                middleInitial = record.middleInitial,
                secondLastName = record.secondLastName,
                businessName = record.businessName,
                comments = record.comments,
                verifiedBy = record.verifiedBy,
                lastVerifiedDate = record.lastVerifiedDate,
                submitDate = record.submitDate,
                submittedBy = record.submittedBy,
                submittedImageLocalURL = record.submittedImageLocalURL,
                status = record.status,
                statusDescription = record.statusDescription,
                languageID = record.languageID,
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
                V.userLicenseCertificationID,
                V.ProviderUserID As userID,
                V.PositionID As jobTitleID,
                V.licenseCertificationID,
                V.VerificationStatusID as statusID,
                V.licenseCertificationNumber,
                V.licenseCertificationUrl,
                V.expirationDate,
                V.issueDate,
                V.firstName,
                V.lastName,
                V.middleInitial,
                V.secondLastName,
                V.businessName,
                V.comments,
                V.verifiedBy,
                V.lastVerifiedDate,
                V.createdDate as submitDate,
                V.submittedBy,
                V.submittedImageLocalURL,
                VS.verificationStatusName as status,
                VS.verificationStatusDisplayDescription as statusDescription,
                @languageID as languageID
            FROM
                userlicensecertifications As V
                 INNER JOIN
                verificationstatus As VS
                  ON V.VerificationStatusID = VS.VerificationStatusID 
                                 
            WHERE
                V.ProviderUserID = @userID
                 AND
                V.PositionID = @jobTitleID
                 AND 
                VS.LanguageID = @languageID 
        ";
        #endregion

        const string sqlInsertNew = @"
            INSERT into userlicensecertifications (
                ProviderUserID,
                PositionID,
                licenseCertificationID,
                VerificationStatusID,
                licenseCertificationNumber,
                licenseCertificationUrl,
                expirationDate,
                issueDate,
                firstName,
                lastName,
                middleInitial,
                secondLastName,
                businessName,
                comments,
                verifiedBy,
                lastVerifiedDate,
                createdDate,
                submittedBy,
                submittedImageLocalURL
                ) VALUES (
                    @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, 
                    getdate(), 
                    @16, 
                    @17  
                )
                SELECT @@Identity
        ";

        private static void insertNew (int userID, int jobTitleID, int licenseCertificationID, string submittedImageLocalURL)
        {
            var user = UserProfile.Get(userID);
            using (var db = new LcDatabase())
            {
                db.Execute(sqlInsertNew,
                userID,
                jobTitleID,
                licenseCertificationID,
                2,
                "",
                "",
                "",
                "",
                user.firstName,
                user.lastName,
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                userID,
                submittedImageLocalURL
                );
            }
        }

        public static IEnumerable<UserLicenseCertification> GetList(int userID, int jobTitleID, int languageID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID, languageID).Select(FromDB);
            }
        }
        #endregion

        /// Note: On Update/Insert SQL, remember next: EXEC TestAlertProfessionalLicense @0, @1

       #region Request of Review / Submit photo
        const string photoPrefix = "$licenseCertification-";
        public static void SubmitPhoto(int userID, int jobTitleID, int licenseCertificationID, string originalFileName, Stream photo)
        {
            // File name with special prefix
            var autofn = Guid.NewGuid().ToString().Replace("-", "");
            string fileName =  photoPrefix + autofn + (System.IO.Path.GetExtension(originalFileName) ?? ".jpg");
            string virtualPath = LcUrl.RenderAppPath + LcData.Photo.GetUserPhotoFolder(userID);
            var path = HttpContext.Current.Server.MapPath(virtualPath);
            var submittedImageLocalURL = LcUrl.AppUrl + LcData.Photo.GetUserPhotoFolder(userID) + fileName;
            // Check folder or create
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            using (var file = File.Create(path + fileName))
            {
                photo.CopyTo(file);
            }
            
            var msg = "UserID: " + userID + " submitted a photo of their License/Certification to being verified and added. It can be found in the FTP an folder: " + virtualPath;
            var email = "support@loconomics.zendesk.com";

            LcMessaging.SendMail(email, "License/Certification Verification Request", msg);
            insertNew(userID, jobTitleID, licenseCertificationID, submittedImageLocalURL);
        }
        #endregion
    }
}