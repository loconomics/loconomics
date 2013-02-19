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
    public static class UserInfo
    {
        #region User Type
        public enum UserType : int
        {
            None = 0,
            Anonymous = 1,
            Customer = 2,
            Provider = 4,
            User = 7,
            System = 8
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
                    return UserType.Provider;
                case 'c':
                    return UserType.Customer;
                case 'u':
                    return UserType.User;
                case 'a':
                    return UserType.Anonymous;
                case 'n':
                    return UserType.None;
                default:
                    return defaultTo;
            }
        }
        #endregion

        #region Basic Account Info

        /* Get a data row with the User information identified with 'userId' from the database
        */
        public static dynamic GetUserRow(int userId) {

            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userow:" + userId.ToString()] ?? HelperPage.PageData["userow-withcontactdata:" + userId.ToString()];
            if (u == null){
                using (var db = Database.Open("sqlloco")){
                    var sqluser = 
                        //"exec GetUserDetails @0";
                        // NOTE: UserID is needed!
                        // NOTE2: remove location details from this table and query, use GetUserWithContactData
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
                                    SELECT count(*) FROM UserProfilePositions As UPS WHERE UPS.UserID = A.UserID AND UPS.Active=1
                                    ) > 0 THEN Cast(1 As bit)
                                    ELSE Cast(0 As bit)
                                END) As IsActiveProvider
                                
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
                                ,IAuthZumigoVerification
                                ,IAuthZumigoLocation

                            FROM Users A
                                 INNER JOIN
                                UserProfile As UP
                                  ON UP.UserID = A.UserID
                                 INNER JOIN
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
                        //"exec GetUserDetails @0";
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
                                ,AccountStatusID

                                -- Only Providers:
                                ,(CASE WHEN IsProvider=1 AND (
                                    SELECT count(*) FROM UserProfilePositions As UPS WHERE UPS.UserID = A.UserID AND UPS.Active=1
                                    ) > 0 THEN Cast(1 As bit)
                                    ELSE Cast(0 As bit)
                                END) As IsActiveProvider

                                ,ProviderWebsiteURL
                                ,ProviderProfileURL

                                -- Contact data
                                ,MobilePhone
                                ,AlternatePhone
                            
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
                                ,IAuthZumigoVerification
                                ,IAuthZumigoLocation

                            FROM Users A
                                 INNER JOIN
                                UserProfile As UP
                                  ON UP.UserID = A.UserID
                                 INNER JOIN
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

        #region Provider Position

        /* Get a data object with the Positions rows of the user identified with 'userId' from the database
        */
        public static dynamic GetUserPos(int userId, bool onlyActivePositions = false){
        
            var poss = HelperPage.PageData["userposrows:" + userId.ToString()];
            if (poss == null) {
                using (var db = Database.Open("sqlloco")) {
                    var sqlpositions = @"
                        SELECT a.UserID, a.PositionID, a.Active, a.StatusID,
                            PositionSingular, a.UpdatedDate, a.PositionIntro
                        FROM dbo.userprofilepositions a join
                            positions c on a.PositionID = c.PositionID and a.CountryID = c.CountryID and a.LanguageID = c.LanguageID
                        WHERE a.UserID = @0 and c.LanguageID = @2 and c.CountryID = @3
                            AND c.Active = 1
                            AND a.Active = 1 AND ((@1 = 0 AND a.StatusID > 0) OR a.StatusID = 1)
                    ";
                    poss = db.Query(sqlpositions, userId, onlyActivePositions ? 1 : 0, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
                }
                HelperPage.PageData["userposrows:" + userId.ToString()] = poss;
            }
            return poss;
        }
        /* Get a data object with the Positions rows of the current user from the database
        */
        public static dynamic GetUserPos(bool onlyActivePositions = false){
            var poss = HelperPage.PageData["posrows"];
            if (poss == null) {
                poss = GetUserPos(WebSecurity.CurrentUserId);
                HelperPage.PageData["posrows"] = poss;
            }
            return poss;
        }
        /* Get a data object with the Position row of the user 'userId' with PositionId 'posId' from the database
         */
        public static dynamic GetUserPos(int userId, int posId) {
        
            // Implemented a basic, per-page, cache, faster and simplified for each page
            var u = HelperPage.PageData["userpos:" + userId.ToString() + ":" + posId.ToString()];
            if (u == null){
                using (var db = Database.Open("sqlloco")){
                    var sqlpositions = @"
                        SELECT  a.UserID, a.PositionID, a.Active, a.StatusID, 
                                PositionSingular, a.UpdatedDate, a.PositionIntro
                        FROM    dbo.userprofilepositions a join positions c on a.PositionID = c.PositionID 
                        WHERE   a.UserID = @0 and a.PositionID = @1 and c.LanguageID = @2 and c.CountryID = @3
                                AND c.Active = 1 AND a.Active = 1 AND a.StatusID > 0";
                    u = db.QuerySingle(sqlpositions, userId, posId, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
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
                return (int)db.QueryValue("SELECT StatusID FROM UserProfilePositions WHERE UserID = @0 AND PositionID = @1 AND LanguageID = @2 AND LanguageID = @3",
                    userID, positionID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }
        }

        public static Dictionary<int, dynamic> GetUserPositionsStatuses(int userID)
        {
            var d = new Dictionary<int, dynamic>();
            foreach (var p in GetUserPos(userID, false))
                d.Add(p.PositionID, p);
            return d;
        }
        public class UserPositionActivation
        {
            public List<string> Messages
            {
                get;
                private set;
            }
            public enum Statuses : short
            {
                InProgress,
                Enhance,
                Complete
            }
            public Statuses Status;
            public int UserID
            {
                get;
                private set;
            }
            public dynamic NextAlert;
            public UserPositionActivation(int userID)
            {
                Messages = new List<string>();
                Status = Statuses.InProgress;
                UserID = userID;
            }
            /// <summary>
            /// Generates a new UserPositionActivation object with the 'maximum'
            /// values for each field from the passed list.
            /// Messages property will be accumulated,
            /// Status will be the more restricted (lower value),
            /// NextStepURL will be that with lower NextStepRank (first on equal ranks)
            /// </summary>
            /// <param name="list"></param>
            /// <returns></returns>
            public static UserPositionActivation Max(IEnumerable<UserPositionActivation> list)
            {
                if (list == null)
                    throw new ArgumentNullException("list");
                
                UserPositionActivation max = null;
                foreach (var l in list)
                {
                    if (max == null)
                    {
                        max = l;
                        continue;
                    }
                    if ((short)l.Status < (short)max.Status)
                        max.Status = l.Status;
                    max.Messages.AddRange(l.Messages);
                    if (max.NextAlert == null ||
                        l.NextAlert != null && 
                        l.NextAlert.DisplayRank < max.NextAlert.DisplayRank)
                        max.NextAlert = l.NextAlert;
                }
                return max;
            }
        }
        public static UserPositionActivation CheckUserPositionActivation(int userID, Dictionary<int, dynamic> positionsStatuses)
        {
            var newStatuses = GetUserPositionsStatuses(userID);
            var posActivationList = new List<UserPositionActivation>();

            foreach (var ps in newStatuses)
            {
                var rtn = new UserPositionActivation(userID);

                var numbers = LcData.GetUserAlertsNumbers(userID);
                rtn.NextAlert = numbers.NextAlert;

                // Check if is enabled
                if (ps.Value.StatusID == 1)
                {
                    if (ps.Value.StatusID != positionsStatuses[ps.Key].StatusID)
                        // It was enabled right now:
                        rtn.Messages.Add(LcRessources.GetText("PositionActivationComplete", ps.Value.PositionSingular));
                    
                    if (numbers.CountActiveAlerts > 0)
                        rtn.Status = UserPositionActivation.Statuses.Enhance;
                    else
                        rtn.Status = UserPositionActivation.Statuses.Complete;
                }
                else if (ps.Value.StatusID == 2)
                {
                    rtn.Status = UserPositionActivation.Statuses.InProgress;
                    // It is still incomplete, show progress
                    rtn.Messages.Add(LcRessources.GetText("PositionActivationProgress",
                        numbers.CountRequiredPassedAlerts,
                        numbers.CountRequiredAlerts,
                        ps.Value.PositionSingular)
                    );
                }

                posActivationList.Add(rtn);
            }

            return UserPositionActivation.Max(posActivationList);
        }

        #endregion

        #region Specific Information
        public static string GetMyPublicURL()
        {
            return GetUserPublicURL(WebSecurity.CurrentUserId);
        }
        public static string GetUserPublicURL(int userid, object positionID = null)
        {
            string city = GetUserCity(userid);
            var pos = GetProviderPreferredPosition(userid);
            city = ASP.LcHelpers.StringSlugify(city, 40);
            if (!String.IsNullOrEmpty(city) && pos != null)
            {
                return LcUrl.AppPath + city + "/"
                    + ASP.LcHelpers.StringSlugify(pos.PositionSingular, 40) + "/"
                    + userid + "/" + 
                    (positionID == null ? "" : "?PositionID=" + positionID.ToString());
            }

            return LcUrl.LangPath + "Profile/?UserID=" + userid + (positionID == null ? "" : "&PositionID=" + positionID.ToString());
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
        #endregion

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
        public static string GetFormatedUserResponseTime(dynamic ResponseTimeMinutes)
        {
            var responseTime = "N/A";
            if (ResponseTimeMinutes != null) {
                var ts = TimeSpan.FromMinutes((double)ResponseTimeMinutes);
                responseTime = (ts.Days > 0 ? ts.Days.ToString() + "d " : "") + ts.Hours.ToString() + "hr " + ts.Minutes.ToString() + "min";
            }
            return responseTime;
        }

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
        #endregion
    }
}