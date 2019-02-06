using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using WebMatrix.WebData;
using System.Web.WebPages;

public static partial class LcData
{
    /// <summary>
    /// Methods to get data related with Users and its info, as Positions, addresses...
    /// TODO: Change the 'very basic - per execution' cache system based on the use of HelperPage.PageData[]
    /// by other mechanism as Cache class ('real cache' or asp.net core cache system) or ScopeStorage class
    /// with ScopeStorage.GlobalScope and ScopeStorage.CurrentScope. The problem of PageData is that it doesn't
    /// affects really to all the current execution (request being processed) else the page called, its layout
    /// and every page called with 'RenderPage' but not if is used inside a page called with 'RenderPage' its PageData
    /// modified dissapear in the end of that 'RenderPage' execution, not affecting to Layout, parent page and 'siblings'
    /// pages rendered, being less useful. If the methods are executed in the parent page before a RenderPage, cached data
    /// will affect all pages, but most times this is not being used in this way (more page are 'index page' with multiple
    /// RenderPage). Still, in a more ajax based environment, this per execution cache has not benefits, a better cache
    /// with Cache object, times and deprecations is need it.
    /// </summary>
    public class UserInfo
    {
        #region User Type
        [Obsolete("Needs refactor and move to LcEnum namespace")]
        public enum UserType : int
        {
            None = 0,
            Anonymous = 1,
            [Obsolete("Use Client, same internal value")]
            Customer = 2,
            Client = 2,
            [Obsolete("Use ServiceProfessional, same internal value")]
            Provider = 4,
            ServiceProfessional = 4,
            // All Members are Providers too,
            // so an option 'only member' does NOT exists
            // and its value gets reserved for use
            // grouped with the Provider (then, in binary 4 + 8 => 12)
            //OnlyMember = 8,
            Member = 4 | 8,
            Admin = 16,
            Contributor = 32,
            LoggedUser = 2 | 4 | 8 | 16 | 32,
            User = 1 | 2 | 4 | 8 | 16 | 32,
            System = 128
        }
        public static UserType ParseUserType(string strtype, UserType defaultTo = UserType.None)
        {
            var ut = defaultTo;
            Enum.TryParse<UserType>(strtype, true, out ut);
            return ut;
        }
        /// <summary>
        /// Parse UserType based on a single identifying char
        /// </summary>
        /// <param name="chartype">'p' for provider, 'c' for customer, 's' for system, 'u' for user, 'a' for anonymous, 'n' for none</param>
        /// <param name="defaultTo"></param>
        /// <returns></returns>
        public static UserType ParseUserType(char chartype, UserType defaultTo = UserType.None)
        {
            switch (chartype)
            {
                case 's':
                    return UserType.System;
                case 'p':
                    return UserType.ServiceProfessional;
                case 'c':
                    return UserType.Client;
                case 'u':
                    return UserType.User;
                case 'a':
                    return UserType.Anonymous;
                case 'n':
                    return UserType.None;
                case 'm':
                    return UserType.Member;
                default:
                    return defaultTo;
            }
        }
        #endregion

        #region Model class (incomplete; required use for not allowed inter-dll dynamic anonymous types)
        public int UserID;
        public string FirstName;
        public string LastName;
        public string MiddleInitial;
        public string SecondLastName;
        public string Email;
        public string MobilePhone;
        public UserInfo()
        {
        }
        #endregion

        #region Account personal data
        #region Query Basic Account Info
        public static dynamic GetUserRowWithContactData(int userId) {
            using (var db = Database.Open("sqlloco")) {
                var sqluser = 
                    // NOTE: UserID is needed!
                    // CREATED A NEW VIEW CALLED vwUsersContactData WITH THIS EXACT CONTENT
                    // PLEASE, ANY CHANGE REPLICATE IT ON THAT VIEW, THAT IS USED BY SOME
                    // STORED PROCEDURE TOO
                    // (THE ONLY MISSING THING OF COURSE IS THE USERID CONDITION)
                    @"
                        SELECT
                            -- Basic data
                            a.UserID
                            ,UP.Email
                            ,a.CreatedDate As MemberSinceDate

                            -- Name
                            ,FirstName
                            ,LastName
                            ,SecondLastName
                            ,MiddleIn
                            ,(dbo.fx_concat(dbo.fx_concat(dbo.fx_concat(FirstName, dbo.fx_concatBothOrNothing(MiddleIn, '.', ''), ' '), LastName, ' '), SecondLastName, ' ')) As FullName
                            
                            -- DEPRECATED PHOTO
                            ,Photo

                            -- User Type
                            ,coalesce(IsAdmin, cast(0 as bit)) As IsAdmin
                            ,IsCustomer
                            ,IsProvider
                            ,AccountStatusID

                            -- Only Providers:
                            ,(CASE WHEN IsProvider=1 AND (
                                SELECT count(*) FROM UserProfilePositions As UPS
                                -- Must have almost one position active and enabled (1) or disabled manually (3).
                                WHERE UPS.UserID = A.UserID AND UPS.Active=1 AND UPS.StatusID IN (1, 3)
                                ) > 0 THEN Cast(1 As bit)
                                ELSE Cast(0 As bit)
                            END) As IsActiveProvider

                            ,OnboardingStep

                            ,ProviderWebsiteURL
                            ,ProviderProfileURL

                            -- Contact data
                            ,MobilePhone
                            ,AlternatePhone
                            ,ProviderWebsiteURL
                            
                            -- Address
                            ,L.AddressLine1
                            ,L.AddressLine2
                            ,L.City
                            ,L.StateProvinceID
                            ,SP.StateProvinceName
                            ,SP.StateProvinceCode
                            ,L.CountryID
                            ,PC.PostalCode
                            ,L.PostalCodeID

                            -- Personal data
                            ,PublicBio
                            ,A.GenderID
                            ,GenderSingular
                            ,GenderPlural
                            ,SubjectPronoun
                            ,ObjectPronoun
                            ,PossesivePronoun
                                                            
                            -- Some preferences
                            ,PreferredLanguage

                        FROM Users A
                                INNER JOIN
                            UserProfile As UP
                                ON UP.UserID = A.UserID
                                LEFT JOIN
                            Gender As G
                                ON G.GenderID = A.GenderID
                                AND G.Language= A.PreferredLanguage                             
                                LEFT JOIN
                            Address As L
                                ON L.UserID = A.UserID
                                AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                                LEFT JOIN
                            StateProvince As SP
                                ON SP.StateProvinceID = L.StateProvinceID
                                LEFT JOIN
                            PostalCode As PC
                                ON PC.PostalCodeID = L.PostalCodeID
                        WHERE A.UserID = @0
                    ";
                return db.QuerySingle(sqluser, userId);
            }
        }
        #endregion
        #endregion

        #region Provider Position
        #region Utilities
        /// <summary>
        /// Creates a new random BookCode for the given provider.
        /// Its size is 64 or lower ever, suitable for the database field.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="positionID"></param>
        /// <returns></returns>
        public static string GenerateBookCode(int userID)
        {
            var r = LcEncryptor.GenerateRandomToken(userID.ToString() + "_");
            r = ASP.LcHelpers.GetLastStringChars(r, 64);
            return r;
        }
        /// <summary>
        /// Regenerates the BookCode for all providers and positions.
        /// </summary>
        public static void RegenerateAllUsersBookCode()
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Iterate each user in database and give a new BookCode
                foreach (var u in db.Query("SELECT UserID FROM Users"))
                {
                    db.Execute("UPDATE Users SET BookCode = @1 WHERE UserID = @0", u.UserID, GenerateBookCode(u.UserID));
                }
            }
        }
        #endregion

        #region Get
        public static int GetUserPositionStatus(int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var locale = LcRest.Locale.Current;
                var statusID = db.QueryValue("SELECT StatusID FROM UserProfilePositions WHERE UserID = @0 AND PositionID = @1 AND Language = @2",
                    userID, positionID, locale.ToString());
                if (statusID is int)
                    return statusID;
                else
                    // There is no position for the user, there is no user, or not for the languagen and country
                    return -1;
            }
        }
        #endregion
        #endregion

        #region Specific Information
        public static string GetMyPublicURL()
        {
            return GetUserPublicSeoUrlPath(WebSecurity.CurrentUserId);
        }

        public static string GetUserPublicUrlPath(int userid, int? positionID = null)
        {
            return LcUrl.AppPath + "#!listing/" + userid + (positionID == null ? "" : "/" + positionID.ToString());
        }

        /// <summary>
        /// Get the optimized for SEO URL of the user, with fallback to GetUserPublicUrlPath
        /// </summary>
        /// <param name="userid"></param>
        /// <param name="positionID"></param>
        /// <returns></returns>
        public static string GetUserPublicSeoUrlPath(int userid, int? positionID = null)
        {
            string city = GetUserCity(userid);
            var pos = GetProviderPreferredPosition(userid);
            city = ASP.LcHelpers.StringSlugify(city, 40);
            if (!String.IsNullOrEmpty(city) && pos != null)
            {
                return LcUrl.AppPath + city + "/"
                    + ASP.LcHelpers.StringSlugify(pos.PositionSingular, 40) + "/"
                    + userid + "/" + 
                    (positionID == null ? "" : "?jobTitleID=" + positionID.ToString());
            }

            return GetUserPublicUrlPath(userid, positionID);
        }

        public static string GetUserCity(int userid)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return (string)db.QueryValue(@"
                    SELECT  TOP 1 PC.City
                    FROM    Address As L
                             INNER JOIN
                            PostalCode As PC
                              ON L.PostalCodeID = PC.PostalCodeID
                    WHERE   L.UserID = @0
                            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                ", userid);
            }
        }
        public static dynamic GetProviderPreferredPosition(int userid)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(@"
                    SELECT  TOP 1 P.*
                    FROM    UserProfilePositions As UP
                             INNER JOIN
                            Positions As P
                              ON P.PositionID = UP.PositionID
                    WHERE   UP.UserID = @0
                ", userid);
            }
        }

        /// <summary>
        /// Get a dynamic row with the user preferences 
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public static dynamic GetUserPrefs(int userId)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(@"
                    SELECT  UserID
                            ,SMSBookingCommunication
                            ,PhoneBookingCommunication
                            ,LoconomicsCommunityCommunication
                            ,LoconomicsDBMCampaigns
                            ,ProfileSEOPermission
                            ,LoconomicsMarketingCampaigns
                            ,CoBrandedPartnerPermissions
                    FROM Users WHERE UserID = @0
                    ", userId);
            }
        }

        public static void SetOnboardingStep(int userID, string onboardingStep)
        {
            using (var db = Database.Open("sqlloco"))
            {
                db.Execute("UPDATE users SET OnboardingStep = @1 WHERE userid = @0",
                    userID,
                    String.IsNullOrWhiteSpace(onboardingStep) ? null : onboardingStep
                );
            }
        }
        #endregion

        #region Stats
        /// <summary>
        /// Get a dynamic row with the user statistics
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public static dynamic GetUserStats(int userId)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle("SELECT UserID, ResponseTimeMinutes FROM UserStats WHERE UserID = @0", userId);
            }
        }
        public static decimal GetCustomerGlobalRating(int userId)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var r = db.QueryValue(@"
		            SELECT	((coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0)) / 3) As Rating
		            FROM	Users As U
				             INNER JOIN
				            UserReviewScores AS UR
				              ON UR.UserID = U.UserID
					            AND UR.PositionID = 0
                ", userId);

                if (r == null)
                    return 0;

                // Round to .5 or .0
                r = Decimal.Round(r * 10);
                var rest = Decimal.Round(r * 10) % 5m;
                r += (rest > .25m ? 5 - rest : -rest);
                r = r / 10m;
                return r;
            }
        }
        
        public static string GetFormatedUserResponseTime(dynamic ResponseTimeMinutes)
        {
            var responseTime = "N/A";
            if (ResponseTimeMinutes != null) {
                var ts = TimeSpan.FromMinutes((double)ResponseTimeMinutes);
                responseTime = (ts.Days > 0 ? ts.Days.ToString() + "d " : "") + ts.Hours.ToString() + "hr " + ts.Minutes.ToString() + "min";
            }
            return responseTime;
        }
        public static void RegisterLastActivityTime()
        {
            if (!WebSecurity.IsAuthenticated || WebSecurity.CurrentUserId < 0) return;
            SetLastActivityLoginTimes(DateTime.Now, null);
        }
        public static void RegisterLastLoginTime(int userId = 0, string username = "")
        {
            SetLastActivityLoginTimes(DateTime.Now, DateTime.Now, userId, username);
        }
        public static void SetLastActivityLoginTimes(DateTime activityTime, DateTime? loginTime, int userId = 0, string username = "")
        {
            if (userId == 0 && WebSecurity.IsAuthenticated && WebSecurity.CurrentUserId > 0)
                userId = WebSecurity.CurrentUserId;
            if (userId == 0) return;
            using (var db = Database.Open("sqlloco"))
            {
                if (userId == 0)
                    userId = (int)(db.QueryValue(@"SELECT UserID FROM UserProfile WHERE Email like @0", username) ?? 0);
                db.Execute(@"
                    UPDATE  UserStats
                    SET     LastActivityTime = @1
                            ,LastLoginTime = coalesce(@2, LastLoginTime)
                    WHERE   UserID = @0
                    IF @@rowcount = 0
                    BEGIN
                        INSERT INTO UserStats (UserID, LastActivityTime, LastLoginTime)
                        VALUES (@0, @1, @2)
                    END
                ", userId, activityTime, loginTime);
            }
        }
        #endregion

        #region Bank Info
        /// <summary>
        /// Get a record with the Bank Info (AKA Provider Payment Preference) of a user.
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static dynamic GetUserBankInfo(int userID) {
            using (var db = Database.Open("sqlloco")) {
                return db.QuerySingle(@"
                    SELECT  TOP 1 P.*,
                            (SELECT TOP 1 DependsOnID FROM ProviderPaymentPreferenceType As T
                             WHERE T.ProviderPaymentPreferenceTypeID = P.ProviderPaymentPreferenceTypeID
                            ) As ProviderPaymentPreferenceTypeDependsOnID
                    FROM    providerpaymentpreference As P
                    WHERE   ProviderUserID = @0
                ", userID);
            }
        }
        #endregion
    }
}