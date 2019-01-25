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

        /* Get a data row with the User information identified with 'userId' from the database
        */
        public static dynamic GetUserRow(int userId) {

            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userow:" + userId.ToString()] ?? HelperPage.PageData["userow-withcontactdata:" + userId.ToString()];
            if (u == null){
                using (var db = Database.Open("sqlloco")){
                    var sqluser = 
                        // NOTE: UserID is needed!
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
                                ,IsContributor
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
                            
                                -- Personal data
                                ,PublicBio
                                ,A.GenderID
                                ,GenderSingular
                                ,GenderPlural
                                ,SubjectPronoun
                                ,ObjectPronoun
                                ,PossesivePronoun

                                -- Some preferences
                                ,PreferredLanguageID
                                ,PreferredCountryID

                            FROM Users A
                                 INNER JOIN
                                UserProfile As UP
                                  ON UP.UserID = A.UserID
                                 LEFT JOIN
                                Gender As G
                                  ON G.GenderID = A.GenderID
                                  	AND G.LanguageID = A.PreferredLanguageID  
                                  	AND G.CountryID = A.PreferredCountryID                                         
                            WHERE A.UserID = @0
                        ";
                    u = db.QuerySingle(sqluser, userId);
                }
                HelperPage.PageData["userow:" + userId.ToString()] = u;
            }
            return u;
        }
        public static dynamic GetUserRowWithContactData(int userId) {
            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userow-withcontactdata:" + userId.ToString()];
            if (u == null){
                using (var db = Database.Open("sqlloco")){
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
                                ,PreferredLanguageID
                                ,PreferredCountryID

                            FROM Users A
                                 INNER JOIN
                                UserProfile As UP
                                  ON UP.UserID = A.UserID
                                 LEFT JOIN
                                Gender As G
                                  ON G.GenderID = A.GenderID
                                  	AND G.LanguageID = A.PreferredLanguageID  
                                  	AND G.CountryID = A.PreferredCountryID                                
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
                    u = db.QuerySingle(sqluser, userId);
                }
                HelperPage.PageData["userow-withcontactdata:" + userId.ToString()] = u;
            }
            return u;
        }
        /* Get a data row with the current user information from the database
        */
        public static dynamic GetUserRow() {
            if (!WebSecurity.IsAuthenticated) return null;
            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userow"] ?? HelperPage.PageData["userow-withcontactdata"];
            if (u == null){
                HelperPage.PageData["userow"] = u = GetUserRow(WebSecurity.CurrentUserId);
            }
            // Maybe this authenticated user (with valid cookie) doesn't exist just now, do a redirect to Logout to avoid more pages from break!
            if (u == null) {
                // A simple WebSecurity.Logout() doesn't work because we must ensure that user is not already inside a SecurePage
                HttpContext.Current.Response.Redirect(LcUrl.LangPath + "Account/Logout/", true);
            }
            return u;
        }
        public static dynamic GetUserRowWithContactData() {
            if (!WebSecurity.IsAuthenticated) return null;
            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userow-withcontactdata"];
            if (u == null){
                HelperPage.PageData["userow-withcontactdata"] = u = GetUserRowWithContactData(WebSecurity.CurrentUserId);
            }
            // Maybe this authenticated user (with valid cookie) doesn't exist just now, do a redirect to Logout to avoid more pages from break!
            if (u == null) {
                // A simple WebSecurity.Logout() doesn't work because we must ensure that user is not already inside a SecurePage
                HttpContext.Current.Response.Redirect(LcUrl.LangPath + "Account/Logout/", true);
            }
            return u;
        }
        public static dynamic GetRequestedUserRow(int userid = 0) {
            var u = HelperPage.PageData["requesteduserrow"];
            if (u == null || u != null && userid > 0 && u.UserID != userid) {
                if (userid == 0) {
                    userid = HttpContext.Current.Request["userid"].AsInt();
                }
                HelperPage.PageData["requesteduserrow"] = u = GetUserRow(userid);
            }
            return u;
        }
        #endregion

        #region Update personal data
        public static void BecomeCollaborator(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                db.Execute(@"
                    UPDATE users SET IsCollaborator=1 WHERE UserID = @0
                ", userID);
            }
        }
        #endregion
        #endregion

        #region Provider Position

        #region Cache
        public static void CleanCacheGetUserPos(int userId)
        {
            HelperPage.PageData["userposrows:" + userId.ToString() + ":active"] = null;
            HelperPage.PageData["userposrows:" + userId.ToString() + ":all"] = null;
        }
        public static void CleanCacheGetUserPos()
        {
            HelperPage.PageData["posrows:active"] = null;
            HelperPage.PageData["posrows:all"] = null;
        }
        public static void CleanCacheGetUserPos(int userId, int posId)
        {
            HelperPage.PageData["userpos:" + userId.ToString() + ":" + posId.ToString()] = null;
        }
        public static void CleanCacheGetUserCurrentPos()
        {
            HelperPage.PageData["position"] = null;
        }
        #endregion

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
        /* Get a data object with the Positions rows of the user identified with 'userId' from the database
        */
        public static dynamic GetUserPos(int userId, bool onlyActivePositions = false){
            var cachekey = String.Format("userposrows:{0}:{1}", userId, onlyActivePositions ? "active" : "all");

            var poss = HelperPage.PageData[cachekey];
            if (poss == null) {
                using (var db = Database.Open("sqlloco")) {
                    var sqlpositions = @"
                        SELECT a.UserID, a.PositionID, a.Active, a.StatusID, InstantBooking,
                            PositionSingular, PositionPlural, a.UpdatedDate, a.PositionIntro
                        FROM dbo.userprofilepositions a join
                            positions c on a.PositionID = c.PositionID and a.CountryID = c.CountryID and a.LanguageID = c.LanguageID
                        WHERE a.UserID = @0 and c.LanguageID = @2 and c.CountryID = @3
                            AND c.Active = 1
                            AND a.Active = 1 AND ((@1 = 0 AND a.StatusID > 0) OR a.StatusID = 1)
                            AND (c.Approved = 1 Or c.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
                    ";
                    poss = db.Query(sqlpositions, userId, onlyActivePositions ? 1 : 0, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                }
                HelperPage.PageData[cachekey] = poss;
            }
            return poss;
        }
        /* Get a data object with the Positions rows of the current user from the database
        */
        public static dynamic GetUserPos(bool onlyActivePositions = false){
            var cachekey = "posrows:" + (onlyActivePositions ? "active" : "all");
            var poss = HelperPage.PageData[cachekey];
            if (poss == null) {
                poss = GetUserPos(WebSecurity.CurrentUserId, onlyActivePositions);
                HelperPage.PageData[cachekey] = poss;
            }
            return poss;
        }
        /* Get a data object with the Position row of the user 'userId' with PositionId 'posId' from the database
         */
        public static dynamic GetUserPos(int userId, int posId, int langID = 0, int countryID = 0)
        {
            if (langID == 0) langID = LcData.GetCurrentLanguageID();
            if (countryID == 0) countryID = LcData.GetCurrentCountryID();

            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userpos:" + userId.ToString() + ":" + posId.ToString()];
            if (u == null){
                using (var db = Database.Open("sqlloco")){
                    var sqlpositions = @"
                        SELECT  a.UserID, a.PositionID, a.Active, a.StatusID, InstantBooking,
                                PositionSingular, PositionPlural, a.UpdatedDate, a.PositionIntro
                        FROM    dbo.userprofilepositions a join positions c on a.PositionID = c.PositionID 
                        WHERE   a.UserID = @0 and a.PositionID = @1 and c.LanguageID = @2 and c.CountryID = @3
                                AND c.Active = 1 AND a.Active = 1 AND a.StatusID > 0";
                    u = db.QuerySingle(sqlpositions, userId, posId, langID, countryID);
                }
                HelperPage.PageData["userpos:" + userId.ToString() + ":" + posId.ToString()] = u;
            }
            return u;
        }
        public static dynamic GetUserCurrentPos() {
            if (HelperPage.PageData["position"] == null) {
                HelperPage.PageData["position"] = GetUserPos(WebSecurity.CurrentUserId, HttpContext.Current.Request["positionid"].AsInt());
            }
            return HelperPage.PageData["position"];
        }
        public static dynamic GetCurrentRequestedUserPos() {
            if (HelperPage.PageData["position"] == null) {
                int userid = HttpContext.Current.Request["UserID"].AsInt();
                userid = userid == 0 ? HelperPage.PageData["requesteduserrow"] != null ? HelperPage.PageData["requesteduserrow"].UserID : WebSecurity.CurrentUserId : userid;
                HelperPage.PageData["position"] = GetUserPos(userid, HttpContext.Current.Request["positionid"].AsInt());
            }
            return HelperPage.PageData["position"];
        }
        public static int GetUserPositionStatus(int userID, int positionID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var statusID = db.QueryValue("SELECT StatusID FROM UserProfilePositions WHERE UserID = @0 AND PositionID = @1 AND LanguageID = @2 AND LanguageID = @3",
                    userID, positionID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                if (statusID is int)
                    return statusID;
                else
                    // There is no position for the user, there is no user, or not for the languagen and country
                    return -1;
            }
        }
        public static Dictionary<int, dynamic> GetUserPositionsStatuses(int userID)
        {
            var d = new Dictionary<int, dynamic>();
            foreach (var p in GetUserPos(userID, false))
                d.Add(p.PositionID, p);
            return d;
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

        #region Verifications
        public static dynamic GetUserVerifications(int userID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT  UV.LastVerifiedDate,
                            UV.VerificationStatusID,
                            VS.VerificationStatusName,
                            V.VerificationType,
                            V.Icon,
                            V.VerificationID,
                            V.VerificationCategoryID
                    FROM    UserVerification As UV
                             INNER JOIN
                            Verification As V
                              ON UV.VerificationID = V.VerificationID
                             INNER JOIN
                            VerificationStatus As VS
                              ON UV.VerificationStatusID = VS.VerificationStatusID
                                AND V.LanguageID = @1 AND V.CountryID = @2
                    WHERE   UserID = @0
                ", userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }
        }

        public static bool HasEmailVerification(int userID)
        {
            using (var db = Database.Open("sqlloco")) {
                return N.D(db.QueryValue(@"SELECT ConfirmationToken FROM webpages_Membership WHERE UserId=@0", userID)) == null;
            }
        }

        public static bool HasFacebookVerification(int userID)
        {
            using (var db = Database.Open("sqlloco")) {
                return (db.QueryValue(@"
                    SELECT count(*)
                    FROM userverification
                    WHERE UserId=@0 AND PositionID=0 AND VerificationID=8 AND VerificationStatusID=1",
                userID)) == 1;
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