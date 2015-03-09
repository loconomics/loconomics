using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Implements the scheme for a 'service-address' object
/// in the REST API, and static methods for database
/// operations
/// </summary>
public class LcRestMarketplaceProfile
{
    #region Fields
    public int userID;

    public string publicBio;
    public string freelancerProfileUrl;
    public string freelancerWebsiteUrl;
    public string bookCode;

    public DateTime createdDate;
    public DateTime updatedDate;
    #endregion

    public static LcRestMarketplaceProfile FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestMarketplaceProfile {
            userID = record.userID,
            publicBio = record.publicBio,
            freelancerProfileUrl = record.freelancerProfileUrl,
            freelancerWebsiteUrl = record.freelancerWebsiteUrl,
            bookCode = record.bookCode,
            createdDate = record.createdDate,
            updatedDate = record.updatedDate
        };
    }

    #region SQL
    private const string sqlSelectProfile = @"
        SELECT TOP 1
            Users.userID

            ,publicBio
            ,providerProfileUrl
            ,providerWebsiteUrl
            ,bookCode   
                        
            ,createdDate
            ,updatedDate
        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
        WHERE Users.UserID = @0
            AND Active = 1
    ";

    private const string sqlUpdateProfile = @"
        DECLARE 
        @UserID int
        ,@PublicBio varchar(500)
        ,@ProviderProfileURL varchar(2078)
        ,@ProviderWebsiteURL varchar(2078)

        SET @UserID = @0
        SET @PublicBio = @1
        SET @ProviderProfileURL = @2
        SET @ProviderWebsiteURL = @3

        UPDATE	Users
        SET     PublicBio = @PublicBio
		        ,ProviderProfileURL = @ProviderProfileURL
		        ,ProviderWebsiteURL = @ProviderWebsiteURL

                ,UpdatedDate = getdate()
                ,ModifiedBy = 'sys'
        WHERE   UserId = @UserID

        EXEC TestAlertPublicBio @UserID
    ";
    #endregion

    #region Fetch
    public static LcRestMarketplaceProfile GetUserProfile(int userID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            var profile = FromDB(db.QuerySingle(sqlSelectProfile, userID));

            // Book Code: must be checked if exists or auto create one.
            // NOTE: BookCode generation was added to the LcAuth.BecomeProvider process,
            // so with the time this check will not be need (previously, not all provider
            // accounts were created with BecomeProvider and that didn't create the BookCode for a while.
            if (String.IsNullOrWhiteSpace(profile.bookCode)) {
                profile.bookCode = LcData.UserInfo.GenerateBookCode(userID);
                db.Execute("UPDATE Users SET BookCode = @1 WHERE UserID = @0", userID, profile.bookCode);
            }

            return profile;
        }
    }
    #endregion

    #region Update
    public static int UpdateUserProfile(LcRestMarketplaceProfile profile)
    {
        using (var db = Database.Open("sqlloco")) {

            return (int)db.QueryValue(sqlUpdateProfile,
                profile.userID,
                profile.publicBio,
                profile.freelancerProfileUrl,
                profile.freelancerWebsiteUrl
            );
        }
    }
    #endregion

    #region Constraints
    private const string sqlCheckProfileUrlAvailabiality = @"
        SELECT  count(*)
        FROM    users
        WHERE   UserID <> @0
                AND ProviderProfileURL like @1
    ";

    public static bool IsProfileUrlAvailable(int userID, string profileUrl)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Check that profile-url is not in use by other provider, but discarding in the check the own user
            return (
                String.IsNullOrWhiteSpace(profileUrl) ||
                db.QueryValue(sqlCheckProfileUrlAvailabiality, userID, profileUrl) == 0
            );
        }
    }
    #endregion
}