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
        public string secondLastName;
        public string middleInitial;
        public string businessName;
        public string actions;
        public string comments;
        public string verifiedBy;
        public DateTime? lastVerifiedDate;
        public DateTime createdDate;
        public DateTime updatedDate;
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
            {
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
                secondLastName = record.secondLastName,
                middleInitial = record.middleInitial,
                actions = record.actions,
                comments = record.comments,
                verifiedBy = record.verifiedBy,
                lastVerifiedDate = record.lastVerifiedDate,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,

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
        ";
        #endregion

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
        public static void UploadPhoto(int userID, int jobTitleID, string stateProvinceCode, string originalFileName, Stream photo)
        {
            // File name with special prefix
            var autofn = Guid.NewGuid().ToString().Replace("-", "");
            string fileName =  photoPrefix + autofn + (System.IO.Path.GetExtension(originalFileName) ?? ".jpg");
            string virtualPath = LcUrl.RenderAppPath + LcData.Photo.GetUserPhotoFolder(userID);
            var path = HttpContext.Current.Server.MapPath(virtualPath);

            // Check folder or create
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
            using (var file = File.Create(path + fileName))
            {
                photo.CopyTo(file);
            }

            var msg = "UserID: " + userID + " sends a photo of its License/Certification to being verified and added. It's for stateProvinceCode: " + stateProvinceCode + 
                ". Can be found in the FTP an folder: " + virtualPath;
            var email = ASP.LcHelpers.InLive ? "support@loconomics.zendesk.com" : "iagosrl@gmail.com;joshdanielson@gmail.com;support@loconomics.zendesk.com";

            LcMessaging.SendMail(email, "License/Certification Verification Request", msg);
        }
        #endregion
    }
}