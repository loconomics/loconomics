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
        public int userLicenseVerificationID;
        public int userID;
        public int jobTitleID;
        public int licenseCertificationID;
        public int statusID;
        public string licenseCertificationNumber;
        public string licenseCertificationUrl;
        public string licenseCertificationStatus;
        public DateTime? expirationDate;
        public DateTime? issueDate;
        public string countryCode;
        public string stateProvinceCode;
        public string stateProvinceName;
        public string countyName;
        public string city;
        public string firstName;
        public string lastName;
        public string middleInitial;
        public string secondLastName;
        public string businessName;
        public string actions;
        public string comments;
        public string verifiedBy;
        public DateTime? lastVerifiedDate;
        public DateTime createdDate;
        public DateTime updatedDate;
        public bool required;
        public string publicLicenseURL; 
        public string status; 
        public string statusDescription; 
        #endregion

        #region Link
        public LicenseCertification licenseCertification;
        #endregion

        #region Instances
        public UserLicenseCertification() { }

        public static UserLicenseCertification FromDB(dynamic record)
        {
            if (record == null) return null;
            return new UserLicenseCertification
            {   userLicenseVerificationID = record.userLicenseVerificationID,
                userID = record.userID,
                jobTitleID = record.jobTitleID,
                licenseCertificationID = record.licenseCertificationID,
                statusID = record.statusID,
                licenseCertificationNumber = record.licenseCertificationNumber,
                licenseCertificationUrl = record.licenseCertificationUrl,
                licenseCertificationStatus = record.licenseCertificationStatus,
                expirationDate = record.expirationDate,
                issueDate = record.issueDate,
                countryCode = record.countryCode,
                stateProvinceCode = record.stateProvinceCode,
                stateProvinceName = record.stateProvinceName,
                countyName = record.countyName,
                city = record.city,
                firstName = record.firstName,
                lastName = record.lastName,
                middleInitial = record.middleInitial,
                secondLastName = record.secondLastName,
                businessName = record.businessName,
                actions = record.actions,
                comments = record.comments,
                verifiedBy = record.verifiedBy,
                lastVerifiedDate = record.lastVerifiedDate,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,
                required = record.required,
                publicLicenseURL = record.publicLicenseURL,
                status = record.status,
                statusDescription = record.statusDescription,

                licenseCertification = LicenseCertification.FromDB(record)
            };
        }
        #endregion

        #region Fetch
        #region SQL
        const string sqlGetList = @"
            SELECT
                V.userLicenseVerificationID,
                V.ProviderUserID As userID,
                V.PositionID As jobTitleID,
                V.licenseCertificationID,
                V.VerificationStatusID as statusID,
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
                V.middleInitial,
                V.secondLastName,
                V.businessName,
                V.actions,
                V.comments,
                V.verifiedBy,
                V.lastVerifiedDate,
                V.createdDate,
                V.modifiedDate as updatedDate,
                V.required, 
                V.publicLicenseURL,
                VS.verificationStatusName as status,
                VS.verificationStatusDisplayDescription as statusDescription,

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
                verificationstatus As VS
                  ON V.VerificationStatusID = VS.VerificationStatusID AND VS.LanguageID = 1 AND VS.CountryID = 1
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
        ";
        #endregion

        const string sqlInsertNew = @"
            INSERT into userlicenseverification (
                ProviderUserID,
                PositionID,
                licenseCertificationID,
                VerificationStatusID,
                licenseCertificationNumber,
                licenseCertificationUrl,
                LicenseStatus,
                expirationDate,
                issueDate,
                city,
                firstName,
                lastName,
                middleInitial,
                secondLastName,
                businessName,
                actions,
                comments,
                verifiedBy,
                lastVerifiedDate,
                createdDate,
                modifiedDate,
                Required,
                PublicLicenseURL
                ) VALUES (
                    @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, 
                    getdate(), 
                    getdate(), 
                    getdate(), 
                    @19, @20, @21
                )
                SELECT @@Identity
        ";

        private static void insertNew (int userID, int jobTitleID, string stateProvinceCode, bool Required, string publicLicenseURL)
        {
            var user = UserProfile.Get(userID);
            using (var db = new LcDatabase())
            {
                db.Execute(sqlInsertNew,
                userID,
                jobTitleID,
                (Required ? -1 : 0),
                1,
                "",
                "",
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
                "SYS",
                Required,
                publicLicenseURL
                );
            }
        }

        public static IEnumerable<UserLicenseCertification> GetList(int userID, int jobTitleID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetList, userID, jobTitleID).Select(FromDB);
            }
        }
        #endregion

        /// Note: On Update/Insert SQL, remember next: EXEC TestAlertProfessionalLicense @0, @1

       #region Request of Review / Upload photo
        const string photoPrefix = "$licenseCertification-";
        public static void UploadPhoto(int userID, int jobTitleID, string stateProvinceCode, string originalFileName, Stream photo, bool Required)
        {
            // File name with special prefix
            var autofn = Guid.NewGuid().ToString().Replace("-", "");
            string fileName =  photoPrefix + autofn + (System.IO.Path.GetExtension(originalFileName) ?? ".jpg");
            string virtualPath = LcUrl.RenderAppPath + LcData.Photo.GetUserPhotoFolder(userID);
            var path = HttpContext.Current.Server.MapPath(virtualPath);
            var publicLicenseURL = LcUrl.AppUrl + LcData.Photo.GetUserPhotoFolder(userID) + fileName;
            // Check folder or create
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            using (var file = File.Create(path + fileName))
            {
                photo.CopyTo(file);
            }
     /// JOSH: added some text letting us know if it's required or not: "and Required is equal to" + Required +
            var msg = "UserID: " + userID + " sends a photo of its License/Certification to being verified and added. It's for stateProvinceCode: " + stateProvinceCode + "and Required is equal to" + Required +
                ". Can be found in the FTP an folder: " + virtualPath;
            var email = "support@loconomics.zendesk.com";

            LcMessaging.SendMail(email, "License/Certification Verification Request", msg);
            insertNew(userID, jobTitleID, stateProvinceCode, Required, publicLicenseURL);
        }
        #endregion
    }
}