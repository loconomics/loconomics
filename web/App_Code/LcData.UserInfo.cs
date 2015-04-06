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
        public enum UserType : int
        {
            None = 0,
            Anonymous = 1,
            Customer = 2,
            Provider = 4,
            Admin = 8,
            User = 15,
            System = 16
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
                        //"exec GetUserDetails @0";
                        // NOTE: UserID is needed!
                        // NOTE2: remove location details from GetUserDetails (in this sql is not already), for that use GetUserWithContactData
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
                        //"exec GetUserDetails @0";
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
                                ,PC.TimeZone

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
        public static void UpdatePersonalAndContactData(
            int userId,
            string firstName,
            string middleInitial,
            string lastName,
            string secondLastName,
            string mobilePhone,
            string alternatePhone,
            string street1,
            string street2,
            string city,
            int stateId,
            int postalCodeId,
            int countryId,
            int languageId,
            int? genderId)
        {
            using (var db = Database.Open("sqlloco"))
            {
                // Check what data changes to revoke verifications and update data:
                db.Execute(@"
                    DECLARE 
                    @UserID int
                    ,@FirstName varchar(50)
                    ,@MiddleIn varchar(1)
                    ,@LastName varchar(145)
                    ,@SecondLastName varchar(145)
                    ,@MobilePhone varchar(20)
                    ,@AlternatePhone varchar(20)
                    ,@AddressLine1 varchar(145)
                    ,@AddressLine2 varchar(145)
                    ,@City varchar(145)
                    ,@StateProvinceID int
                    ,@PostalCodeID int
                    ,@CountryID int
                    ,@GenderID int
                    ,@LanguageID int

                    SET @UserID = @0
                    SET @FirstName = @1
                    SET @MiddleIn = @2
                    SET @LastName = @3
                    SET @SecondLastName = @4
                    SET @MobilePhone = @5
                    SET @AlternatePhone = @6
                    SET @AddressLine1 = @7
                    SET @AddressLine2 = @8
                    SET @City = @9
                    SET @StateProvinceID = @10
                    SET @PostalCodeID = @11
                    SET @CountryID = @12
                    SET @GenderID = @13
                    SET @LanguageID = @14

                    -- Getting the original data for that optional fields that
                    -- passed as NULL instead of Empty.
                    SELECT
                        @MiddleIn = coalesce(@MiddleIn, MiddleIn)
                        ,@SecondLastName = coalesce(@SecondLastName, SecondLastName)
                        ,@AlternatePhone = coalesce(@AlternatePhone, AlternatePhone)
                        ,@GenderID = coalesce(@GenderID, GenderID)
                    FROM users
                    WHERE UserId = @UserID
                    
                    SELECT  @AddressLine2 = coalesce(@AddressLine2, AddressLine2)
                    FROM    Address
                    WHERE   UserID = @UserID
                            AND AddressTypeID = 1 -- Home address

                    -- Saving all the data and updating verifications
                    BEGIN TRAN

                    /* Do checks to revoke verifications on some changes */
                    -- @c var allow us check if data is equals (=1) or was changed (=0)
                    DECLARE @c int

                    -- Checking Full Name
                    SELECT  @c = count(*)
                    FROM    Users
                    WHERE   UserID = @UserID
                                AND
                            FirstName = @FirstName AND MiddleIn = @MiddleIn AND LastName = @LastName AND SecondLastName = @SecondLastName
                    IF @c = 0 BEGIN
                        -- Revoke social verifications (all VerificationCategoryID = 3)
                        UPDATE  UserVerification SET
                            VerificationStatusID = 3, -- revoked status
                            UpdatedDate = getdate()
                        WHERE   VerificationID IN (
                                    SELECT VerificationID
                                    FROM    Verification
                                    WHERE   VerificationCategoryID = 3
                                )

                        -- Revoke name verification (VerificationID=1)
                        UPDATE  UserVerification SET
                            VerificationStatusID = 3, -- revoked status
                            UpdatedDate = getdate()
                        WHERE   VerificationID = 1

                        -- Revoke background check verification (VerificationID=7)
                        UPDATE  UserVerification SET
                            VerificationStatusID = 3, -- revoked status
                            UpdatedDate = getdate()
                        WHERE   VerificationID = 7
                    END

                    -- Checking Address
                    SELECT  @c = count(*)
                    FROM    Address
                    WHERE   UserID = @UserID
                            AND AddressTypeID = 1 -- Must be the type 1, its personal-home address
                            AND AddressLine1 = @AddressLine1
                            AND AddressLine2 = @AddressLine2
                            AND City = @City
                            AND StateProvinceID = @StateProvinceID
                            AND PostalCodeID = @PostalCodeID
                            AND CountryID = @CountryID
                    IF @c = 0 BEGIN
                        -- Revoke address verification (VerificationID=2)
                        UPDATE  UserVerification SET
                            VerificationStatusID = 3, -- revoked status
                            UpdatedDate = getdate()
                        WHERE   VerificationID = 2
                    END

                    -- Checking Phone
                    SELECT  @c = count(*)
                    FROM    Users
                    WHERE   UserID = @UserID
                            AND MobilePhone = @MobilePhone
                            AND AlternatePhone = @AlternatePhone
                    IF @c = 0 BEGIN
                        -- Revoke phone verification (VerificationID=4)
                        UPDATE  UserVerification SET
                            VerificationStatusID = 3, -- revoked status
                            UpdatedDate = getdate()
                        WHERE   VerificationID = 4
                    END


                    /** UPSERT Personal Address **/
                    EXEC SetHomeAddress @UserID, @AddressLine1, @AddressLine2, @City, @StateProvinceID, @PostalCodeID, @CountryID, @LanguageID


                    /* Update User Personal Data */
                    UPDATE	Users
                    SET     FirstName = @FirstName
		                    ,MiddleIn = @MiddleIn
		                    ,LastName = @LastName
		                    ,SecondLastName = @SecondLastName
		                    ,MobilePhone = @MobilePhone
		                    ,AlternatePhone = @AlternatePhone

		                    ,GenderID = @GenderID

                            ,UpdatedDate = getdate()
                            ,ModifiedBy = 'sys'
                    WHERE   UserId = @UserID

                    -- A lot of direct and indirect alerts depend on contact info,
                    -- execute all its alerts for all its positions
                    EXEC TestAllUserAlerts @UserID

                    COMMIT TRAN
                ", userId,
                 firstName,
                 middleInitial,
                 lastName,
                 secondLastName,
                 mobilePhone,
                 alternatePhone,
                 street1,
                 street2,
                 city,
                 stateId,
                 postalCodeId,
                 countryId,
                 genderId,
                 languageId
                );
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

        #region Create
        public static void InsProviderPosition(int userID, int positionID,
            int cancellationPolicyID = LcData.Booking.DefaultCancellationPolicyID,
            string intro = null,
            bool instantBooking = false)
        {
            var jobTitleExists = LcData.JobTitle.GetJobTitle(positionID) != null;
            if (jobTitleExists)
            {
                LcData.JobTitle.InsertUserJobTitle(
                    userID,
                    positionID,
                    cancellationPolicyID,
                    intro,
                    instantBooking,
                    LcData.GetCurrentLanguageID(),
                    LcData.GetCurrentCountryID()
                );
            }
            else
            {
                throw new Exception("The job title does not exists or is disapproved");
            }
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
        public static dynamic GetUserPos(int userId, int posId) {
        
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

        #region Checkes
        public class UserPositionActivation
        {
            public List<string> Messages
            {
                get;
                private set;
            }
            /// <summary>
            /// Enumeration to distinguish more than profile actived-not actived.
            /// </summary>
            public enum Statuses : short
            {
                /// <summary>
                /// InProgress for when the profile is not activated still because there are required alerts on
                /// </summary>
                InProgress = 1,
                /// <summary>
                /// Enhance for when the profile is already activated but there are non required alerts on
                /// </summary>
                Enhance = 2,
                /// <summary>
                /// JustCompleted for when the profile gets activated right now (last required alert went off just now) and there are
                /// no more alerts (if was activated right now and there are still non required alerts, Enhance Must be used instead of this)
                /// </summary>
                JustCompleted = 3,
                /// <summary>
                /// Completed for when the profile it has all alerts off, is activated but it get activated in a previuos action.
                /// </summary>
                Complete = 4
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
            // Avoid cache before get updated data:
            CleanCacheGetUserPos(userID);
            var newStatuses = GetUserPositionsStatuses(userID);
            var posActivationList = new List<UserPositionActivation>();

            var totalNumbers = LcData.GetUserAlertsNumbers(userID);

            foreach (var ps in newStatuses)
            {
                var rtn = new UserPositionActivation(userID);

                // Get alert numbers for this position or an empty numbers if there is no alerts actived for the position.
                var numbers = totalNumbers.ContainsKey(ps.Key) ? totalNumbers[ps.Key] : new LcData.UserAlertsNumbers();
                rtn.NextAlert = numbers.NextAlert;

                // Check if is enabled
                if (ps.Value.StatusID == 1)
                {
                    // By default, set as complete until other conditions change it:
                    rtn.Status = UserPositionActivation.Statuses.Complete;

                    if (ps.Value.StatusID != positionsStatuses[ps.Key].StatusID)
                    {
                        // It was enabled right now:
                        rtn.Status = UserPositionActivation.Statuses.JustCompleted;
                        rtn.Messages.Add(LcRessources.GetText("PositionActivationComplete", ps.Value.PositionSingular));
                    }
                    // There are still non required alerts? must be showed as Enhance
                    if (numbers.CountActiveAlerts > 0)
                        rtn.Status = UserPositionActivation.Statuses.Enhance;
                }
                else if (ps.Value.StatusID == 2)
                {
                    rtn.Status = UserPositionActivation.Statuses.InProgress;
                    if (numbers.CountRequiredAlerts > 0)
                    {
                        // It is still incomplete, show progress
                        rtn.Messages.Add(LcRessources.GetText("PositionActivationProgress",
                            numbers.CountRequiredPassedAlerts,
                            numbers.CountRequiredAlerts,
                            ps.Value.PositionSingular)
                        );
                    }
                }

                posActivationList.Add(rtn);
            }

            return UserPositionActivation.Max(posActivationList);
        }
        #endregion
        #endregion

        #region Specific Information
        public static string GetMyPublicURL()
        {
            return GetUserPublicURL(WebSecurity.CurrentUserId);
        }
        /// <summary>
        /// TODO: rename to GetUserPublicURLPath since it doesn't includes the domain part.
        /// </summary>
        /// <param name="userid"></param>
        /// <param name="positionID"></param>
        /// <returns></returns>
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