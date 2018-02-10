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
        const string sqlGetItem = sqlGetList + @"
            AND V.userLicenseCertificationID = @3
        ";
        #endregion

        public static UserLicenseCertification Get(int userID, int jobTitleID, int languageID, int userLicenseCertificationID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGetItem, userID, jobTitleID, languageID, userLicenseCertificationID));
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

        #region Insert

        #region SQL Insert
        const string sqlInsertNew = @"
            SET NOCOUNT ON

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
                    @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14,
                    null,
                    getdate(), 
                    @15, 
                    @16  
                )

                -- EXEC TestAlertProfessionalLicense @0, @1

                SELECT @@Identity
        ";
        #endregion

        private static int Insert(UserLicenseCertification item, bool internalUpdate = false)
        {
            // TODO, for an admin dashboard, we may need to implement internalUpdate allowing for update of all non-ID fields.
            if (internalUpdate) throw new NotImplementedException("Internal update not implemented");
            var user = UserProfile.Get(item.userID);
            using (var db = new LcDatabase())
            {
                // Constraint: licenses cannot be duplicated for an existant licenseID (>0), but they can for the special wildcard IDs (-1, 0)
                if (item.licenseCertificationID > 0)
                {
                    var many = (int)db.QueryValue("SELECT count(*) FROM UserLicenseCertifications WHERE ProviderUserID = @0 AND PositionID = @1 AND LicenseCertificationID = @2",
                        item.userID, item.jobTitleID, item.licenseCertificationID);
                    if (many > 0)
                    {
                        throw new ConstraintException("[[[You have already registered that license, please try to update it if you want to submit a new file.]]]");
                    }
                }

                return (int)db.QueryValue(sqlInsertNew,
                    item.userID,
                    item.jobTitleID,
                    item.licenseCertificationID,
                    2,
                    "",
                    "",
                    null,
                    "",
                    user.firstName,
                    user.lastName,
                    "",
                    "",
                    "",
                    "",
                    "",
                    item.userID,
                    item.submittedImageLocalURL
                );
            }
        }

        #endregion

        #region Update
        private static void Update(UserLicenseCertification item, bool internalUpdate = false)
        {
            // TODO, for an admin dashboard, we may need to implement internalUpdate allowing for update of all non-ID fields.
            if (internalUpdate) throw new NotImplementedException("Internal update not implemented");
            using (var db = new LcDatabase())
            {
                db.Execute(@"
                    UPDATE userlicensecertifications SET
                         submittedImageLocalURL = @3
                    WHERE
                        ProviderUserID = @0
                        AND PositionID = @1
                        AND userLicenseCertificationID = @2
                ", item.userID, item.jobTitleID, item.userLicenseCertificationID, item.submittedImageLocalURL);
            }
        }
        #endregion

        #region Set
        static int Set(UserLicenseCertification item, bool internalUpdate = false)
        {
            if (item.userLicenseCertificationID > 0)
            {
                Update(item, internalUpdate);
                return item.userLicenseCertificationID;
            }
            else
            {
                return Insert(item, internalUpdate);
            }
        }
        #endregion

        #region Request of Review / Submit photo
        const string photoPrefix = "$licenseCertification-";


        public static int SubmitPhoto(UserLicenseCertification item, string originalFileName, Stream photo)
        {
            // For updates, needs to remove previous file
            if (item.userLicenseCertificationID > 0)
            {
                var oldItem = Get(item.userID, item.jobTitleID, item.languageID, item.userLicenseCertificationID);
                if (oldItem == null)
                    // Not found:
                    return 0;
                if (!String.IsNullOrEmpty(oldItem.submittedImageLocalURL))
                {
                    var localPath = oldItem.submittedImageLocalURL.Replace(LcUrl.AppUrl, "");
                    localPath = HttpContext.Current.Server.MapPath(LcUrl.RenderAppPath + localPath);
                    File.Delete(localPath);
                }
            }

            // File name with special prefix
            var autofn = Guid.NewGuid().ToString().Replace("-", "");
            string fileName =  photoPrefix + autofn + (System.IO.Path.GetExtension(originalFileName) ?? ".jpg");
            string virtualPath = LcUrl.RenderAppPath + LcData.Photo.GetUserPhotoFolder(item.userID);
            var path = HttpContext.Current.Server.MapPath(virtualPath);
            item.submittedImageLocalURL = LcUrl.AppUrl + LcData.Photo.GetUserPhotoFolder(item.userID) + fileName;
            // Check folder or create
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            using (var file = File.Create(path + fileName))
            {
                photo.CopyTo(file);
            }
            // TODO: i18n
            var msg = "UserID: " + item.userID + " submitted a photo of their License/Certification to being verified and added. It can be found in the FTP an folder: " + virtualPath;
            // TODO create config value
            var email = "support@loconomics.zendesk.com";
            LcMessaging.SendMail(email, "License/Certification Verification Request", msg);

            return Set(item);
        }
        #endregion
    }
}