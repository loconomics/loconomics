using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.IO;
using System.Web.WebPages;
using System.Drawing;
using System.Web.Helpers;
using System.Drawing.Imaging;

public static partial class LcData
{
    /// <summary>
    /// Getting and setting photos related to users on database and file system (User Work Photos, Profile Picture)
    /// 
    /// TODO: Converto to LcRest scheme?
    /// </summary>
    public static class Photo
    {
        #region General
        public static string GetUserPhotoFolder(int userID)
        {
            return "img/userphotos/u" + userID.ToString() + "/";
        }
        #endregion

        #region Profile Picture
        const int profilePictureFixedSizeWidth = 120;
        const int profilePictureFixedSizeHeight = 120;
        const int profilePictureOriginalScale = 5;
        const string avatarName = "$avatar";
        const string avatarNamePrefix = avatarName + "-";
        const LcImaging.SizeMode profilePictureSizeMode = LcImaging.SizeMode.Cover;

        public static string PublicUserProfilePictureUrl = LcUrl.LangUrl + "Profile/Photo/";

        public static void UpdateProfilePictureOnDb(int userID, bool hasPhoto)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // We set the name, now ever fixed as '$avatar', without extension, to allow TestAlertPhoto validate this,
                // no more because is not need.
                db.Execute(@"
                    UPDATE  users
                    SET     photo=@0
                    WHERE   UserID=@1
                    -- Check Alerts:
                    EXEC TestAlertPhoto @1
                ", hasPhoto ? "$avatar" : null, userID);
            }
        }

        public static void DeleteProfilePicture(int userID)
        {
            string virtualPath = LcUrl.RenderAppPath + GetUserPhotoFolder(userID);
            UpdateProfilePictureOnDb(userID, false);

            var folder = System.Web.HttpContext.Current.Server.MapPath(virtualPath);

            foreach (var f in Directory.GetFiles(folder, avatarName + "*", SearchOption.TopDirectoryOnly))
            {
                try
                {
                    File.Delete(f);
                }
                catch { }
            }
        }

        /// <summary>
        /// Save the uploaded photo as an image on the user folder
        /// with a greater size than usual but limited,
        /// for later use on cropping and resizing tasks.
        /// </summary>
        /// <param name="photo"></param>
        /// <param name="virtualPath"></param>
        public static void SaveEditableProfilePicture(int userID, Stream photo)
        {
            // Check folder or create
            string virtualPath = LcUrl.RenderAppPath + GetUserPhotoFolder(userID);
            var folder = System.Web.HttpContext.Current.Server.MapPath(virtualPath);
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            // Use file as image
            using (var srcImg = System.Drawing.Image.FromStream(photo))
            {

                // Resize to maximum allowed size (but not upscale) to allow user cropping later
                var img = LcImaging.Resize(srcImg, profilePictureFixedSizeWidth * profilePictureOriginalScale, profilePictureFixedSizeHeight * profilePictureOriginalScale, profilePictureSizeMode);

                // Save:
                img.Save(folder + avatarName + ".jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
            }

            photo.Dispose();
        }

        /// <summary>
        /// Sets the previously uploaded 'editable avatar' image as the
        /// current user avatar, cropped with the given values and 
        /// optimized sizes.
        /// </summary>
        /// <param name="virtualPath"></param>
        public static void SaveProfilePicture(int userID, int x, int y, int width, int height)
        {
            string virtualPath = LcUrl.RenderAppPath + GetUserPhotoFolder(userID);
            var folder = System.Web.HttpContext.Current.Server.MapPath(virtualPath);

            // Remove previous cropped/sized/adapted photos (except editable one), all start with avatarNamePrefix
            // File.Delete doesn't allow wildcards, find and delete each one
            foreach (var f in Directory.GetFiles(folder, avatarNamePrefix + "*", SearchOption.TopDirectoryOnly))
                File.Delete(f);

            // Create optimized files
            using (var img = System.Drawing.Image.FromFile(folder + avatarName + ".jpg"))
            {
                // Crop
                var cropImg = LcImaging.Crop(img, x, y, width, height);
                img.Dispose();

                // Size prefix
                var sizeName = profilePictureFixedSizeWidth.ToString() + "x" + profilePictureFixedSizeHeight.ToString();

                // Save image with profile size and original color
                using (var modImg = LcImaging.Resize(cropImg, profilePictureFixedSizeWidth, profilePictureFixedSizeHeight, LcImaging.SizeMode.Cover, LcImaging.AnchorPosition.Center))
                {
                    modImg.Save(folder + avatarNamePrefix + sizeName + ".jpg");
                }

                // Save image with profile size and grayscale (-gray)
                using (var modImg = LcImaging.Grayscale(LcImaging.Resize(cropImg, profilePictureFixedSizeWidth, profilePictureFixedSizeHeight, LcImaging.SizeMode.Cover, LcImaging.AnchorPosition.Center)))
                {
                    modImg.Save(folder + avatarNamePrefix + sizeName + "-gray.jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
                }

                // Same as previous but for hi-res 2x devices: (real pixel sizes is double but preserve the original size name to recognize it better adding the @2x suffix
                using (var modImg = LcImaging.Grayscale(LcImaging.Resize(cropImg, profilePictureFixedSizeWidth * 2, profilePictureFixedSizeHeight * 2, LcImaging.SizeMode.Cover, LcImaging.AnchorPosition.Center)))
                {
                    modImg.Save(folder + avatarNamePrefix + sizeName + "-gray@2x.jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
                }
                // NOTE Creation of images with more sizes (for small user widgets on reviews/bookings/etc) or filters go here
            }
        }

        /// <summary>
        /// Sends user profile picture, or default image, to the Web Response Output.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="type"></param>
        public static void OutputProfilePicture(int userID, string type)
        {
            if (type == "2x")
            {
                type = "@2x";
            }
            else if (!String.IsNullOrWhiteSpace(type))
            {
                type = "-" + type;
            }

            var Response = HttpContext.Current.Response;
            var userFolder = GetUserPhotoFolder(userID);
            bool imageAdapted = false;
            var sizeName = profilePictureFixedSizeWidth.ToString() + "x" + profilePictureFixedSizeHeight.ToString();

            // And it happens again, new size change, so the next comment, just two times:
            // To fix #558, because the change of size (so file name changed too), we do double try
            // for a while
            // TODO FUTURE: When there are no more oldSize (or a few, convert it manually), remove this and its use
            const string veryOldSizeName = "176x184";
            const string oldSizeName = "112x118";

            // "$avatar"
            // Standard name of pre-adapted image, just
            // serve ever the profile adapted photo for now instead the big colored original:
            var userPhoto = "$avatar-" + sizeName + "-gray" + type + ".jpg";
            imageAdapted = true;
            // Physical image path to userPhoto
            var path = HttpContext.Current.Request.MapPath(LcUrl.RenderAppPath + userFolder + userPhoto);

            // Try the OLD size if it doesn't exists the new:
            if (!System.IO.File.Exists(path))
            {
                imageAdapted = false;
                // Update name and path
                userPhoto = "$avatar-" + oldSizeName + "-gray" + type + ".jpg";
                path = HttpContext.Current.Request.MapPath(LcUrl.RenderAppPath + userFolder + userPhoto);
            }
            // Try the VERY OLD size if it doesn't exists the new:
            if (!System.IO.File.Exists(path))
            {
                imageAdapted = false;
                // Update name and path
                userPhoto = "$avatar-" + veryOldSizeName + "-gray" + type + ".jpg";
                path = HttpContext.Current.Request.MapPath(LcUrl.RenderAppPath + userFolder + userPhoto);
            }

            // Last fallback: default image
            if (!System.IO.File.Exists(path))
            {
                imageAdapted = true;
                if (type == "@2x")
                {
                    userPhoto = "img/userphotos/u0/avatar-2x.png";
                }
                else
                {
                    userPhoto = "img/userphotos/u0/avatar.png";
                }
                path = HttpContext.Current.Server.MapPath(LcUrl.RenderAppPath + userPhoto);
            }

            try
            {
                if (imageAdapted)
                {
                    new WebImage(path).Write();
                }
                else
                {
                    // Transform image to Grayscale and profile photo size to avoid big images:
                    // Is inside a using block because ensure close the image ressources and the file
                    using (var img = LcImaging.Grayscale(LcImaging.Resize(new System.Drawing.Bitmap(path), profilePictureFixedSizeWidth, profilePictureFixedSizeHeight, profilePictureSizeMode, LcImaging.AnchorPosition.Center)))
                    {
                        // Telling to the browser that this is a JPG image
                        Response.ContentType = "image/jpg";
                        // Send the transformed image to the browser
                        img.Save(Response.OutputStream, ImageFormat.Jpeg);
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Work Photos
        #region Info, Properties
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
        /// cannot be removed:
        /// this return value allows to another process to get the remove the file from the filesystem,
        /// but with empty string it can remove nothing.
        /// </summary>
        /// <param name="photoID"></param>
        /// <param name="userID"></param>
        /// <param name="positionID"></param>
        /// <returns></returns>
        private static string DeleteDbWorkPhoto(int photoID, int userID, int positionID)
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
        public static bool DeleteWorkPhoto(int photoID, int userID, int positionID)
        {
            string photoAddress = DeleteDbWorkPhoto(photoID, userID, positionID);
            string baseFolder = HttpContext.Current.Server.MapPath(LcUrl.RenderAppPath) + GetUserPhotoFolder(userID);
            return DeleteWorkPhotoFiles(baseFolder, photoAddress);
        }

        private static bool DeleteWorkPhotoFiles(string baseFolder, string photoPath)
        {
            if (!String.IsNullOrEmpty(photoPath))
            {
                // Remove file from user folder
                try
                {
                    // There are several files for the same photo, with suffixes for different
                    // sizes and optimizations: delete all of them
                    var fileName = System.IO.Path.GetFileNameWithoutExtension(LcUtils.GetNameWithoutSuffix(photoPath));

                    // Delete the original file, no suffix
                    File.Delete(baseFolder + fileName + ".jpg");
                    // Delete all files with suffix.
                    // File.Delete doesn't allow wildcards, find and delete each one
                    foreach (var f in Directory.GetFiles(baseFolder, fileName + "-*", SearchOption.TopDirectoryOnly))
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

        /// <summary>
        /// Update a Work Photo record on Database.
        /// Parameters: fileName, caption and rankPosition with value 'null' will keep the currently saved value at database
        /// </summary>
        /// <param name="photoID"></param>
        /// <param name="userID"></param>
        /// <param name="positionID"></param>
        /// <param name="caption"></param>
        /// <param name="rankPosition"></param>
        private static void SaveDbWorkPhoto(int photoID, int userID, int positionID, string fileName, string caption, int? rankPosition)
        {
            using (var db = Database.Open("sqlloco"))
            {
                /* SQL update of primary photo not used now, since field is not in use, but was on the sql beggining:
                    IF @isPrimaryPhoto = 1 BEGIN
                        UPDATE ProviderServicePhoto SET
                            IsPrimaryPhoto = 0
                        WHERE   UserID = @3 AND PositionID = @4
                    END
                 */
                db.Execute(@"
                UPDATE ProviderServicePhoto SET
                    PhotoAddress = coalesce(@1, PhotoAddress)
                    ,PhotoCaption = coalesce(@2, PhotoCaption)
                    ,RankPosition = coalesce(@3, RankPosition)
                WHERE   ProviderServicePhotoID = @0 AND UserID = @4 AND PositionID = @5

                -- Test Alert
                EXEC TestAlertShowcaseWork @4, @5
            ", photoID, fileName, caption, rankPosition, userID, positionID);
            }
        }

        /// <summary>
        /// Create new Work Photo record on Database
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="userId"></param>
        /// <param name="positionId"></param>
        /// <param name="rankPosition"></param>
        /// <returns></returns>
        private static int RegisterDbWorkPhoto(int userId, int positionId, string fileName, string caption = null, int? rankPosition = null)
        {
            using (var db = Database.Open("sqlloco"))
            {
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

                /* Auto calculate rankposition if not provided, to be the last photo */
                DECLARE @rankPosition int
                IF @4 > 0 BEGIN
                    SET @rankPosition = @4
                END ELSE BEGIN
                    SELECT @rankPosition = ( coalesce(max(P2.RankPosition),0) + 1 )
                    FROM ProviderServicePhoto As P2
                    WHERE P2.UserID=@0 AND P2.PositionID=@1
                END

                INSERT INTO ProviderServicePhoto (
                    UserID
                    ,PositionID
                    ,PhotoAddress
                    ,PhotoCaption
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
                    ,@3
	                ,@rankPosition
	                ,getdate()
	                ,getdate()
	                ,'sys'
	                ,1
                    ,@IsPrimary
                )
                SELECT Cast(@@Identity as int)

                -- Test Alert
                EXEC TestAlertShowcaseWork @0, @1
            ", userId, positionId, fileName, caption, rankPosition ?? 0);
            }
        }
        #endregion
        
        #region Upload

        /// <summary>
        /// Allows to upload a new work photo for a user and job title, or replace an existing one (when photoID is no zero).
        /// It saves the given stream as user file and process it with the common sizes and the given cropping option.
        /// If a photoID is given, the previous file is removed and the new uploaded, updating name/url.
        /// It returns the photoID, that is new on creation.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="photo"></param>
        /// <param name="photoID"></param>
        /// <param name="jobTitleID"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="width"></param>
        /// <param name="height"></param>
        public static int UploadWorkPhoto(int userID, Stream photo, int jobTitleID, int photoID = 0, string caption = null, int? rankPosition = null, int x = 0, int y = 0, int width = 0, int height = 0)
        {
            // Automatic name for new photo
            string fileName = Guid.NewGuid().ToString().Replace("-", "");
            string virtualPath = LcUrl.RenderAppPath + GetUserPhotoFolder(userID);
            var path = HttpContext.Current.Server.MapPath(virtualPath);

            if (photoID > 0) {
                var savedPhoto = GetUserWorkPhoto(userID, jobTitleID, photoID);
                // Delete previous files
                DeleteWorkPhotoFiles(path, savedPhoto.fileName);
            }

            // New Photo File
            UploadEditablePhoto(photo, path, fileName);
            // Process best sizes and cropping
            var processedFileName = ProcessWorkPhoto(path, fileName, x, y, width, height);

            // Save on database
            if (photoID > 0)
            {
                SaveDbWorkPhoto(photoID, userID, jobTitleID, fileName, caption, rankPosition);
            }
            else
            {
                photoID = RegisterDbWorkPhoto(userID, jobTitleID, processedFileName, caption, rankPosition);
            }
            return photoID;
        }

        /// <summary>
        /// Save the uploaded photo as an image on the user folder
        /// with a greater size than usual but limited,
        /// for later use on cropping and resizing tasks.
        /// </summary>
        /// <param name="photo"></param>
        /// <param name="virtualPath"></param>
        private static void UploadEditablePhoto(Stream photo, string path, string fileName) {
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
            photo.Dispose();
        }

        /// <summary>
        /// Create from the 'editable image' processed versions: cropped with the given values and 
        /// optimized sizes.
        /// </summary>
        /// <param name="virtualPath"></param>
        private static string ProcessWorkPhoto(string path, string fileName, int x, int y, int width, int height)
        {
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

        #region Get and List
        public class WorkPhoto
        {
            public int workPhotoID;
            public int userID;
            public string caption;
            public string fileName;
            public string url;
            public int rankPosition;
            public DateTime updatedDate;

            public static WorkPhoto FromDB(dynamic record)
            {
                if (record == null) return null;
                return new WorkPhoto
                {
                    workPhotoID = record.workPhotoID,
                    userID = record.userID,
                    caption = record.caption,
                    fileName = record.fileName,
                    url = LcUrl.AppUrl + GetUserPhotoFolder(record.userID) + record.fileName,
                    rankPosition = record.rankPosition,
                    updatedDate = record.updatedDate
                };
            }
        }

        public static WorkPhoto GetUserWorkPhoto(int userID, int positionID, int photoID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return WorkPhoto.FromDB(db.QuerySingle(@"
                    SELECT [ProviderServicePhotoID] As workPhotoID
                          ,userID
                          ,[PhotoCaption] As caption
                          ,[PhotoAddress] As fileName
                          ,rankPosition
                          ,[UpdatedDate] As updatedDate
                          -- ,[IsPrimaryPhoto] Unused now
                      FROM [providerservicephoto]
                      WHERE UserID = @0 AND PositionID = @1 AND Active = 1 AND ProviderServicePhotoID = @2
                      ORDER BY RankPosition
                ", userID, positionID, photoID));
            }
        }

        public static IEnumerable<WorkPhoto> GetUserWorkPhotos(int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT [ProviderServicePhotoID] As workPhotoID
                          ,userID
                          ,[PhotoCaption] As caption
                          ,[PhotoAddress] As fileName
                          ,rankPosition
                          ,[UpdatedDate] As updatedDate
                          -- ,[IsPrimaryPhoto] Unused now
                      FROM [providerservicephoto]
                      WHERE UserID = @0 AND PositionID = @1 AND Active = 1
                      ORDER BY RankPosition
                ", userID, positionID).Select(WorkPhoto.FromDB);
            }
        }
        #endregion
        #endregion
    }
}