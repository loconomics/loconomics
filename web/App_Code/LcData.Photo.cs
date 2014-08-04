using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using System.IO;
using System.Web.WebPages;

/// <summary>
/// Getting and setting photos related to users on database and file system
/// </summary>
public static class LcData
{
    #region Info/Base
    public static string GetUserPhotoFolder(int userID)
    {
        return "img/userphotos/u" + userID.ToString() + "/";
    }
    #endregion

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

        if (!String.IsNullOrEmpty(photoAddress)) {
            // Remove file from user folder
            try {
                // There are several files for the same photo, with suffixes for different
                // sizes and optimizations: delete all of them
                var fileName = LcUtils.GetNameWithoutSuffix(photoAddress);
                var sysFolder = baseFolder + GetUserPhotoFolder(userID);

                // Delete the original file, no suffix
                File.Delete(sysFolder + fileName + ".jpg");
                // Delete all files with suffix.
                // File.Delete doesn't allow wildcards, find and delete each one
                foreach (var f in Directory.GetFiles(sysFolder, fileName + "-*", SearchOption.TopDirectoryOnly)) {
                    File.Delete(f);
                }
            } catch {
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
            foreach (var go in galleryOrder.Split(',')) {
                // If we have a valid ID (integer number)
                var goID = go.Replace("UserPhoto-", "").AsInt();
                // Only if is a valid ID
                if (goID > 0) {
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

    public static dynamic GetUserPositionPhotos(int userID, int positionID)
    {
        using (var db = Database.Open("sqlloco")) {
            
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
}