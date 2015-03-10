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
    /// <summary>
    /// Slug or URL fragment choosen by the freelancer
    /// as a custom URL belonging the loconomics.com domain.
    /// About the slug term: https://en.wikipedia.org/wiki/Semantic_URL#Slug
    /// </summary>
    public string freelancerProfileUrlSlug;
    /// <summary>
    /// This full URL is not editable directly, just
    /// a computed using the Loconomics URL and
    /// the freelancer choosen 'slug', or fallback
    /// to the standard URL.
    /// </summary>
    public string freelancerProfileUrl
    {
        get
        {
            var url = BuildFreelancerCustomURL(freelancerProfileUrlSlug);
            if (String.IsNullOrWhiteSpace(url))
            {
                // Gets the standard, base URL provided by Loconomics.
                // It's a SEO friendly URL that additionally to the userID
                // contains information like the city and the primary
                // job title name (if some information is missed it fallbacks
                // to the non-SEO, ID based, URL, ever a valid address).
                return LcUrl.SiteUrl + LcData.UserInfo.GetUserPublicURL(this.userID);
            }
            else
            {
                return url;
            }
        }
    }
    /// <summary>
    /// A full URL outside Loconomics for
    /// a professional website of the freelancer.
    /// </summary>
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
            freelancerProfileUrlSlug = record.freelancerProfileUrlSlug,
            freelancerWebsiteUrl = record.freelancerWebsiteUrl,
            bookCode = record.bookCode,
            createdDate = record.createdDate,
            updatedDate = record.updatedDate
        };
    }

    public static string BuildFreelancerCustomURL(string slug)
    {
        if (String.IsNullOrWhiteSpace(slug))
            return "";
        else
            return LcUrl.AppUrl + ASP.LcHelpers.StringSlugify(slug);
    }

    #region SQL
    private const string sqlSelectProfile = @"
        SELECT TOP 1
            Users.userID

            ,publicBio
            ,providerProfileUrl as freelancerProfileUrlSlug
            ,providerWebsiteUrl as freelancerWebsiteUrl
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
        ,@ProviderProfileURLSlug varchar(2078)
        ,@ProviderWebsiteURL varchar(2078)

        SET @UserID = @0
        SET @PublicBio = @1
        SET @ProviderProfileURLSlug = @2
        SET @ProviderWebsiteURL = @3

        UPDATE	Users
        SET     PublicBio = @PublicBio
		        ,ProviderProfileURL = @ProviderProfileURLSlug
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
    public static void UpdateUserProfile(LcRestMarketplaceProfile profile)
    {
        using (var db = Database.Open("sqlloco")) {
            db.Execute(sqlUpdateProfile,
                profile.userID,
                profile.publicBio,
                profile.freelancerProfileUrlSlug,
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

    public static bool IsProfileUrlAvailable(int userID, string profileUrlSlug)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Check that profile-url is not in use by other provider, but discarding in the check the own user
            return (
                String.IsNullOrWhiteSpace(profileUrlSlug) ||
                db.QueryValue(sqlCheckProfileUrlAvailabiality, userID, profileUrlSlug) == 0
            );
        }
    }
    #endregion
}