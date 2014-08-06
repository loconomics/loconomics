using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.IO;
using System.Web.WebPages;
using System.Drawing;

public static partial class LcData
{
    /// <summary>
    /// Getting and setting photos related to users on database and file system
    /// </summary>
    public static class Photo
    {
        #region Info, Properties
        public static string GetUserPhotoFolder(int userID)
        {
            return "img/userphotos/u" + userID.ToString() + "/";
        }

        public const int FixedSizeWidth = 442;
        public const int FixedSizeHeight = 332;

        public static int GetFileSizeLimit()
        {
            return ASP.LcHelpers.GetMaxRequestSize() * 1024;
        }

        public static string GetValidFileName(string fileName) {
            // Names starting with $ are considered special for us, no allow user to upload a file with that character as prefix:
            return fileName.TrimStart('$');
        }
        #endregion

        #region Edit
        /// <summary>
        /// Delete file from database, checking if exist more than one record
        /// using the same image file, returning the PhotoAddress when there is
        /// no more records sharing that address, and 'empty string' when there is more and
        /// cannot be removed (without know the address, cannot be removed ;-)
        /// </summary>
        /// <param name="photoID"></param>
        /// <param name="userID"></param>
        /// <param name="positionID"></param>
        /// <returns></returns>
        private static string DeleteDbPhoto(int photoID, int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QueryValue(@"
                DECLARE @PhotoID int
                SET @PhotoID = @0

                -- Retrieving the PhotoAddress
                DECLARE @address varchar(2073)
                SELECT  @address = PhotoAddress
                FROM    ProviderServicePhoto
                WHERE   ProviderServicePhotoID = @PhotoID
                            AND UserID = @1 AND PositionID = @2

                DELETE FROM ProviderServicePhoto WHERE ProviderServicePhotoID = @PhotoID
                        AND UserID = @1 AND PositionID = @2

                -- Test Alert
                EXEC TestAlertShowcaseWork @1, @2

                -- Checking if there are more records with the same file, or returning the address
                IF 0 = (SELECT  count(*)
                        FROM    ProviderServicePhoto
                        WHERE   PhotoAddress like @address
                                AND UserID = @1 AND PositionID = @2)
                    SELECT coalesce(@address, '') As PhotoAddress
                ELSE
                    SELECT '' As PhotoAddress
            ", photoID, userID, positionID);
            }
        }

        /// <summary>
        /// Delete photo file from database and file system
        /// </summary>
        /// <param name="photoID"></param>
        /// <param name="userID"></param>
        /// <param name="positionID"></param>
        /// <param name="sysFolder"></param>
        /// <returns></returns>
        public static bool DeletePhoto(int photoID, int userID, int positionID, string baseFolder)
        {
            string photoAddress = DeleteDbPhoto(photoID, userID, positionID);

            if (!String.IsNullOrEmpty(photoAddress))
            {
                // Remove file from user folder
                try
                {
                    // There are several files for the same photo, with suffixes for different
                    // sizes and optimizations: delete all of them
                    var fileName = LcUtils.GetNameWithoutSuffix(photoAddress);
                    var sysFolder = baseFolder + GetUserPhotoFolder(userID);

                    // Delete the original file, no suffix
                    File.Delete(sysFolder + fileName + ".jpg");
                    // Delete all files with suffix.
                    // File.Delete doesn't allow wildcards, find and delete each one
                    foreach (var f in Directory.GetFiles(sysFolder, fileName + "-*", SearchOption.TopDirectoryOnly))
                    {
                        File.Delete(f);
                    }
                }
                catch
                {
                    return false;
                }
            }
            return true;
        }

        public static void SaveDbPhoto(int photoID, string caption, bool isPrimary, int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                db.Execute(@"
                IF @2 = 1 BEGIN
                    UPDATE ProviderServicePhoto SET
                        IsPrimaryPhoto = 0
                    WHERE   UserID = @3 AND PositionID = @4
                END

                UPDATE ProviderServicePhoto SET
                    PhotoCaption = @1
                    ,IsPrimaryPhoto = @2
                WHERE   ProviderServicePhotoID = @0 AND UserID = @3 AND PositionID = @4

                -- Test Alert
                EXEC TestAlertShowcaseWork @3, @4
            ", photoID, caption, isPrimary, userID, positionID);
            }
        }

        public static void SavePhotosOrder(string galleryOrder, int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Comma separated values with the html element IDs that have the format 'UserPhoto-PHOTOID'
                // where PHOTOID is a number with the database record ID.
                // Reading that order and sending to the server
                int orderIndex = 0;
                foreach (var go in galleryOrder.Split(','))
                {
                    // If we have a valid ID (integer number)
                    var goID = go.Replace("UserPhoto-", "").AsInt();
                    // Only if is a valid ID
                    if (goID > 0)
                    {
                        // Save order to the database
                        db.Execute(@"
                        UPDATE  ProviderServicePhoto
                        SET     RankPosition = @1
                        WHERE   ProviderServicePhotoID = @0
                                 AND    
                                UserID = @2
                                 AND
                                PositionID = @3
                    ", goID, ++orderIndex, userID, positionID);
                    }
                }
            }
        }

        public static int RegisterUserPhoto(string fileName, int userId, int positionId)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // we update the new photo name
                return (int)db.QueryValue(@"
                /* #346: Set as primary if is the first provider-position photo */
                DECLARE @IsPrimary bit
                IF NOT EXISTS (
                    SELECT * FROM ProviderServicePhoto
                    WHERE UserID = @0
                        AND PositionID = @1
                )
                    SET @IsPrimary = 1
                ELSE
                    SET @IsPrimary = 0

                INSERT INTO ProviderServicePhoto (
                    UserID
                    ,PositionID
                    ,PhotoAddress
                    ,RankPosition
                    ,CreatedDate
                    ,UpdatedDate
                    ,ModifiedBy
                    ,Active
                    ,IsPrimaryPhoto
                ) VALUES (
	                @0
	                ,@1
	                ,@2
	                ,(SELECT coalesce(max(P2.RankPosition),0) + 1 FROM ProviderServicePhoto As P2 WHERE P2.UserID=@0 AND P2.PositionID=@1)
	                ,getdate()
	                ,getdate()
	                ,'sys'
	                ,1
                    ,@IsPrimary
                )
                SELECT Cast(@@Identity as int)

                -- Test Alert
                EXEC TestAlertShowcaseWork @0, @1
            ", userId, positionId, fileName);
            }
        }

        #endregion
        
        #region Upload

        /// <summary>
        /// Save the uploaded photo as an image on the user folder
        /// with a greater size than usual but limited,
        /// for later use on cropping and resizing tasks.
        /// </summary>
        /// <param name="photo"></param>
        /// <param name="virtualPath"></param>
        public static string UploadEditablePhoto(Stream photo, string path, string fileName) {
            // Check folder or create
            if (!Directory.Exists(path)) {
                Directory.CreateDirectory(path);
            }

            // Use file as image
            using (var srcImg = System.Drawing.Image.FromStream(photo)) {

                // Editable image: Resize to maximum allowed size to allow user cropping later
                var img = LcImaging.Resize(srcImg, FixedSizeWidth * 4, FixedSizeHeight * 4, LcImaging.SizeMode.Contain);

                // Save:
                img.Save(path + fileName + ".jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
            }

            // Prepare the image for regular uses
            var regularFileName = UploadPhoto(path, fileName, 0, 0, 0, 0);

            photo.Dispose();

            return regularFileName;
        }

        /// <summary>
        /// Sets the previously uploaded 'editable avatar' image as the
        /// current user avatar, cropped with the given values and 
        /// optimized sizes.
        /// </summary>
        /// <param name="virtualPath"></param>
        public static string UploadPhoto(string path, string fileName, int x, int y, int width, int height) {
        
            var regularFileName = "";
        
            // fileName could be given by a previous save including suffixes,
            // we need it without suffixes in order to work properly:
            fileName = LcUtils.GetNameWithoutSuffix(fileName);

            // Remove previous cropped/sized/adapted photos (except editable one), all start with fileName plus dash
            // File.Delete doesn't allow wildcards, find and delete each one
            foreach (var f in Directory.GetFiles(path, fileName + "-*", SearchOption.TopDirectoryOnly))
                File.Delete(f);

            Image cropImg = null;

            // Create optimized files
            using (var img = System.Drawing.Image.FromFile(path + fileName + ".jpg")) {
            
                // Crop, if any size
                // On cropping:
                // User used the reduced image (fixed size) to choose what to crop,
                // while we will crop the 'original', 4x larger image, so multiply every unit
                cropImg = width > 0 ? LcImaging.Crop(img, x * 4, y * 4, width * 4, height * 4) : img;
            
                // Size prefix
                var sizeName = "-" + FixedSizeWidth.ToString() + "x" + FixedSizeHeight.ToString();

                // Save image with regular size
            
                using (var modImg = LcImaging.Resize(cropImg, FixedSizeWidth, FixedSizeHeight, LcImaging.SizeMode.Cover, LcImaging.AnchorPosition.Center)) {
                    regularFileName = fileName + sizeName + ".jpg";
                    modImg.Save(path + regularFileName, System.Drawing.Imaging.ImageFormat.Jpeg);
                }

                // Same as previous but for hi-res 2x devices: (real pixel sizes is double but preserve the original size name to recognize it better adding the @2x suffix)
                using (var modImg = LcImaging.Resize(cropImg, FixedSizeWidth * 2, FixedSizeHeight * 2, LcImaging.SizeMode.Cover, LcImaging.AnchorPosition.Center)) {
                    modImg.Save(path + fileName + sizeName + "@2x.jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
                }

                // NOTE Creation of images with more sizes (for small user widgets on reviews/bookings/etc) or filters go here
            }

            // if there was a crop:
            if (width > 0)
            {
                // Replace original image with the cropped version, for future 'crop again' tasks
                using (var replacedEditableImg = LcImaging.Resize(cropImg, FixedSizeWidth * 4, FixedSizeHeight * 4, LcImaging.SizeMode.Contain))
                {
                    replacedEditableImg.Save(path + fileName + ".jpg");
                }
            }
            cropImg.Dispose();
        
            return regularFileName;
        }
        #endregion

        #region List
        public static dynamic GetUserPositionPhotos(int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {

                return db.Query(@"
                SELECT [ProviderServicePhotoID]
                      ,[PhotoCaption]
                      ,[PhotoAddress]
                      ,[IsPrimaryPhoto]
                  FROM [providerservicephoto]
                  WHERE UserID = @0 AND PositionID = @1 AND Active = 1
                  ORDER BY RankPosition
            ", userID, positionID);
            }
        }
        #endregion
    }
}