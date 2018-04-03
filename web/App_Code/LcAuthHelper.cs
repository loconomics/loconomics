/**
    Website authentication pages must use the utilities
    given here on most cases rather than directly the LcAuth API
    since it helps with validate data from form for Log-in and
    required actions depending on the account status and
    different kind of errors.
**/
using System;
using System.Linq;
using System.Web;
using System.Web.WebPages;
using System.Web.WebPages.Html;
using System.Collections;
using System.Collections.Generic;
using WebMatrix.Data;
using WebMatrix.Security;
using WebMatrix.WebData;
using System.Web.Security;

public static class LcAuthHelper
{
    #region WebPage API shortcuts
    private static HttpRequestBase Request
    {
        get
        {
            return HelperPage.Request;
        }
    }

    private static HttpSessionStateBase Session
    {
        get
        {
            return HelperPage.Session;
        }
    }

    private static IDictionary<object, dynamic> PageData
    {
        get
        {
            return HelperPage.PageData;
        }
    }
    #endregion

    #region Login
    public class LoginResult {
        public LoginResult() { }
        public string redirectUrl;
        public int userID;
        /// <summary>
        /// This is the internal 'AutologinKey'
        /// that we need now for the secure session-less REST calls
        /// </summary>
        public string authKey;
        /// <summary>
        /// Authorization token, used as value for header `Authorization: Bearer authToken`
        /// </summary>
        public string authToken;
        //public LcAuth.UserAuthorization authorization;
        public LcRest.UserProfile profile;
        public string onboardingStep;
        public int onboardingJobTitleID;
    }

    public static LoginResult Login(WebPage page) {

        page.Validation.RequireField("username", "[[[You must specify a user name.]]]");
	    page.Validation.RequireField("password", "[[[You must specify a password.]]]");
        
        if (page.Validation.IsValid()) {
            var username = Request.Form["username"];
            var password = Request.Form["password"];
            var rememberMe = Request.Form["rememberMe"].AsBool();
            var returnProfile = Request.Form["returnProfile"].AsBool();
            
            return Login(username, password, rememberMe, returnProfile);
        }
        else {
            // Bad request, input data incorrect because of validation rules
            throw new HttpException(400, LcRessources.ValidationSummaryTitle);
        }
    }

    public static LoginResult Login(string username, string password, bool rememberMe = false, bool returnProfile = false, bool allowUnconfirmed = false)
    {
        // DISABLED CONFIRMATION CHECK FOR BETA PERIOD, BECAUSE WE HAVE NOT THE EMAIL CONFIRMATION READY
        // AFTER THE WHOLE SITE AND MESSAGING CHANGE.
        // TODO: RE-ENABLE AFTER BETA
        //if (!allowUnconfirmed)
        //    checkAccountIsConfirmed(username);

        var auth = LcAuth.Login(username, password, rememberMe);
        if (auth != null)
        {
            return GetLoginResultForID(auth, returnProfile);
        }
        else
        {
            throw new HttpException(400, "Incorrect username or password.");
        }
    }

    private static LoginResult GetLoginResultForID(LcAuth.UserAuthorization authorization, bool returnProfile)
    {
        var authKey = LcAuth.GetAutologinKey(authorization.userID);
        LcRest.UserProfile profile = null;
            
        if (returnProfile) {
            profile = LcRest.UserProfile.Get(authorization.userID);
        }

        return new LoginResult {
            redirectUrl = getRedirectUrl(authorization.userID),
            userID = authorization.userID,
            authKey = authKey,
            authToken = authorization.token,
            //authorization = authorization,
            profile = profile,
            onboardingStep = profile == null ? null : profile.onboardingStep
        };
    }
    #endregion

    #region Logout
    public static void Logout() {
        LcAuth.RemovesCurrentUserAuthorization();
        // Log out of the current user context
        WebSecurity.Logout();
        Session.Clear();
    }
    #endregion

    #region Account Utilities
    public static string getRedirectUrl(string username)
    {
        return getRedirectUrl(WebSecurity.GetUserId(username));
    }

    public static string getRedirectUrl(int userID) {

        string redirect =  N.W(Request["ReturnUrl"]) ??
            N.W(PageData["Redirect"]) ?? N.W(Request["Redirect"]) ??
            "";
        
        // Check Onboarding status (#455):
        string onboardingStep = Database.Open("sqlloco").QueryValue("SELECT coalesce(OnboardingStep, '') FROM users WHERE UserID=@0", userID);
        if (!String.IsNullOrEmpty(onboardingStep)) {
            redirect = LcUrl.LangPath + "dashboard/" + onboardingStep + "/";
        }
        // The redirect cannot be done to an url inside the /Account/ segment:
        else if (redirect.Contains("/Account/")) {
            redirect = "";
        }
            
        // Be carefully with hash value: if a user enter from an external link in an email
        // or bookmark and in some specific cases inside the web,
        // hash value will be send it well but some other times will not be send it;
        // a javascript add the 'HASH' parameter to allow the server to know what is the
        // stripped hash value, re-adding it just now if url doesn't contain it.
        string hash = Request["HASH"];
        if (!redirect.Contains('#') && !string.IsNullOrEmpty(hash)) {
            redirect += "#" + hash;
        }
        
        return redirect;
    }

    public static void checkAccountIsConfirmed(string username) {
        
        // #454: User is auto-logged on registering, allowing it to do the Onboarding,
        // But next times, it is required to confirm email before logged.
        // Since we set IsConfirmed as true on database to let 'auto-logging on register', 
        // we must check for the existance of a confirmation token:
        var userId = WebSecurity.GetUserId(username);

        using (var db = new LcDatabase())
        {
            string token = LcAuth.GetConfirmationToken(userId);
            
            if (userId > -1 && !string.IsNullOrWhiteSpace(token))
            {
                // Resend confirmation mail
                var confirmationUrl = LcUrl.LangUrl + "Account/Confirm/?confirmationCode=" + Uri.EscapeDataString(token ?? "");

                var isProvider = (bool)(db.QueryValue("SELECT IsProvider FROM users WHERE UserID=@0", userId) ?? false);

                if (isProvider)
                {
                    LcMessaging.SendWelcomeProvider(userId, username);
                }
                else
                {
                    LcMessaging.SendWelcomeCustomer(userId, username);
                }

                /// http 409:Conflict
                throw new HttpException(409, "[[[Your account has not yet been confirmed. Please check your inbox and spam folders and click on the e-mail sent.]]]");
            }
        }
    }
    #endregion

    #region Signup
    const int COUNTRY_CODE_USA = 1;
    const string SERVICE_PROFESSIONAL_TYPE = "SERVICE-PROFESSIONAL";

    /// <summary>
    /// Sets the OnboardingStep of the user to 'welcome', so can start the onboarding process
    /// </summary>
    /// <param name="userID"></param>
    private static void StartOnboardingForUser(int userID)
    {
        using (var db = new LcDatabase())
        {
            db.Execute(@"
                UPDATE Users SET 
                OnboardingStep = 'welcome'
                WHERE UserID = @0
            ", userID);
        }
    }

    #region Internal Signup processes
    /// <summary>
    /// Is true when the user exist at database but the account is not enabled (never accepted TOU or created a password).
    /// That happens when:
    /// - Has a status of 'serviceProfessionalClient'
    /// - Has a status of 'subscriber'
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    private static bool IsUserButNotEnabledAccount(LcRest.UserProfile user)
    {
        return (
            user.accountStatusID == (int)LcEnum.AccountStatus.serviceProfessionalClient ||
            user.accountStatusID == (int)LcEnum.AccountStatus.subscriber
        );
    }
    const string UserIsServiceProfessionalClientMessage = @"
        [[[We see one of our service professionals has already scheduled services for you in the past.
        We've just sent an invitation to create your account to {0}.
        Please follow its instructions. We can't wait to get you on board!]]]
    ";
    const string UserIsSubscriberMessage = @"
        [[[We see you have subscribed previously to our newsletter or referrenced a service professional.
        We've just sent an invitation to create your account to {0}.
        Please follow its instructions. We can't wait to get you on board!]]]
    ";
    /// <summary>
    /// Convert a user record with 'Not Enabled Account' into a standard enabled account. See IsUserButNotEnabledAccount
    /// for more info, and check that value before call this to prevent an error when user has an enabled account.
    /// This supports the cases
    /// - User with status of 'serviceProfessionalClient': the user has an account created as client by a service professional.
    /// - User with status of 'subscriber': the user submitted it's email through a Lead Generation API to get in touch with newsletters or
    ///   to reference a service professional.
    /// 
    /// For the conversion, we need support next actions/requests:
    /// - A: We need to communicate that specific situation (error message), generate a confirmation code
    ///   for the existent user, send email to let him to confirm that he/she owns the given e-mail.
    /// - B: On returning here after request/response A, a confirmation code is being provided and we must proceed
    ///   by checking the confirmation code and, on success, enable account (change status), update the membership password and
    ///   continue with a valid set of LoginResult. External code should allow user to update any additional account data.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="email"></param>
    /// <param name="password"></param>
    /// <param name="returnProfile"></param>
    /// <returns></returns>
    private static LoginResult SignupANotEnabledAccount(int userID, string email, string password, bool returnProfile, int accountStatusID)
    {
        // Get confirmation code, if any
        var confirmationCode = Request["confirmationCode"];
        // Prepare error message
        var errTpl = "";
        if (accountStatusID == (int)LcEnum.AccountStatus.serviceProfessionalClient)
        {
            errTpl = UserIsServiceProfessionalClientMessage;
        }
        else if (accountStatusID == (int)LcEnum.AccountStatus.subscriber)
        {
            errTpl = UserIsSubscriberMessage;
        }
        else
        {
            throw new Exception("[[[Not allowed]]]");
        }
        var errMsg = String.Format(errTpl, email);

        // Action/Request A: Create confirmation code
        if (String.IsNullOrEmpty(confirmationCode))
        {
            // To generate a confirmation code (creates the Membership record, that does not exists still)
            // this needs a random password (we still didn't verified the user, so do NOT trust on the given password).
            // NOTE: since this can be attempted several time by the user, and next attempts will fail because the Membership
            // record will exists already, just double check and try creation only if record don't exists:
            if (!LcAuth.HasMembershipRecord(userID))
            {
                WebSecurity.CreateAccount(email, LcAuth.GeneratePassword(), true);
            }
            StartOnboardingForUser(userID);
            // send email to let him to confirm it owns the given e-mail
            LcMessaging.SendWelcomeCustomer(userID, email);
            // Not valid after all, just communicate was was done and needs to do to active its account:
            throw new HttpException(409, errMsg);
        }
        // Action/Request B: confirm confirmation code
        else
        {
            // If confirmation token is valid, enable account and reset password
            if (LcAuth.GetConfirmationToken(userID) == confirmationCode)
            {
                // We know is valid, we can update the accountStatus to be an standard/enabled account
                // and that will allow to set the account as confirmed
                using (var db = new LcDatabase())
                {
                    db.Execute("UPDATE users SET accountStatusID = @1 WHERE UserID = @0", userID, LcEnum.AccountStatus.active);
                }
                // now we can confirm (we already know the code is valid, it will just double check and update database)
                LcAuth.ConfirmAccount(confirmationCode);
                // set the password provided by the user. Trick: we need to generate a reset token in order to set the password.
                var token = WebSecurity.GeneratePasswordResetToken(email);
                LcAuth.ResetPassword(token, password);
                // Left continue with profile data update..
            }
            else
            {
                // RE-send email to let him to confirm it owns the given e-mail
                LcMessaging.SendWelcomeCustomer(userID, email);
                throw new HttpException(409, errMsg);
            }
        }

        // We need a logged object, and additionally a double check is performed (so we ensure setting the password process worked).
        return Login(email, password, false, returnProfile, false);
    }
    #endregion

    /// <summary>
    /// Signup with fields:
    /// - email [required]
    /// - password [required when no facebookUserID is given]
    /// - facebookUserID [optional]
    /// - countryID [optional defaults to COUNTRY_CODE_USA]
    /// - profileType [optional defaults to client]
    /// - utm [optional, not a named form parameter but the whole query string]
    /// - firstName [optional except atBooking]
    /// - lastName [optional except atBooking]
    /// - phone [optional except atBooking]
    /// - returnProfile [optional defaults to false] Returns the user profile in a property of the result
    /// - atBooking [optional]
    /// </summary>
    /// <param name="page"></param>
    /// <returns></returns>
    public static LoginResult Signup(WebPage page)
    {
        page.Validation.RequireField("email", "[[[You must specify an email.]]]");
        // Username is an email currently, so need to be restricted
        page.Validation.Add("email",
            Validator.Regex(LcValidators.EmailAddressRegexPattern, "[[[The email is not valid.]]]"));

        // First data
        var profileTypeStr = Request.Form["profileType"] ?? "";
        var isServiceProfessional = SERVICE_PROFESSIONAL_TYPE == profileTypeStr.ToUpper();
        var isClient = !isServiceProfessional;
        var facebookUserID = Request.Form["facebookUserID"].AsLong(0);
        var facebookAccessToken = Request.Form["facebookAccessToken"];
        var email = Request.Form["email"];
        var atBooking = Request.Form["atBooking"].AsBool();

        //
        // Conditional validations
        // Facebook
        var useFacebookConnect = facebookUserID > 0 && !String.IsNullOrEmpty(facebookAccessToken);
        if (!useFacebookConnect)
        {
            page.Validation.RequireField("password", "[[[You must specify a password.]]]");
            // We manually validate if a password was given, in order to prevent
            // showing up the validation format message additionally to the 'required password' message
            if (!String.IsNullOrWhiteSpace(Request.Form["password"]))
            {
                page.Validation.Add("password", new PasswordValidator());
            }
        }
        else
        {
            var prevFbUser = LcAuth.GetFacebookUser(facebookUserID);
            if (prevFbUser != null)
            {
                throw new HttpException(409, "[[[Facebook account already connected. Sign in.]]]");
            }
        }

        // For a signup at a client booking, we require more fields
        if (atBooking)
        {
            page.Validation.RequireField("phone", "[[[You must specify your mobile phone number.]]]");
            page.Validation.RequireField("firstName", "[[[You must specify your first name.]]]");
            page.Validation.RequireField("lastName", "[[[You must specify your last name.]]]");
        }

        if (page.Validation.IsValid())
        {
            // TODO To use countryCode for a more 'open' public REST API, where 'code' is a well know ISO 2-letters CODE
            //var countryCode = Request.Form["countryCode"] ?? "US";
            var countryID = Request.Form["countryID"].AsInt(COUNTRY_CODE_USA);

            // Autogenerated password (we need to save one) on facebook connect:
            var password = useFacebookConnect ? LcAuth.GeneratePassword() : Request.Form["password"];
            var firstName = Request.Form["firstName"];
            var lastName = Request.Form["lastName"];
            var phone = Request.Form["phone"];
            var returnProfile = Request.Form["returnProfile"].AsBool();

            var utm = Request.Url.Query;
            LoginResult logged = null;

            // If the user exists, try to log-in with the given password,
            // becoming a provider if that was the requested profileType and follow as 
            // a normal login.
            // If the password didn't match, throw a sign-up specific error (email in use)
            // Otherwise, just register the user.
            if (LcAuth.ExistsEmail(email))
            {
                // We query the user with that email
                var userID = WebSecurity.GetUserId(email);
                var user = LcRest.UserProfile.Get(userID);
                // There are special cases when a user is registered, but never has accepted TOU or created a password (Not Enabled Account),
                // and is possible for that user to become an regular/enabled account.
                if (IsUserButNotEnabledAccount(user))
                {
                    logged = SignupANotEnabledAccount(userID, email, password, returnProfile, user.accountStatusID);
                }
                else
                {
                    // If the email exists, we try to log-in using the provided password, to don't bother with "e-mail in use" error 
                    // if the user provides the correct credentials (maybe just don't remember he/she has already an account; make it easy for them
                    // to return).
                    // Try Login
                    try
                    {
                        logged = Login(email, password, false, returnProfile, true);
                        userID = logged.userID;
                        // Ensure we set-up the onboarding even if already exists, and set-up
                        // as a professional if requested
                        // Next code will throw exception on error
                        if (isServiceProfessional)
                        {
                            LcAuth.BecomeProvider(userID);
                        }
                        else
                        {
                            StartOnboardingForUser(userID);
                        }
                    }
                    catch (HttpException)
                    {
                        // Not valid log-in, throw a 'email exists' error with Conflict http code
                        throw new HttpException(409, "[[[E-mail address is already in use.]]]");
                    }
                }

                // Update account data with the extra information.
                using (var db = new LcDatabase())
                {
                    db.Execute(@"
                        UPDATE users SET
                            firstName = coalesce(@1, firstName),
                            lastName = coalesce(@2, lastName),
                            mobilePhone = coalesce(@3, mobilePhone)
                        WHERE userID = @0
                    ", userID, firstName, lastName, phone);
                    // Create a home address record almost with the country
                    var home = LcRest.Address.GetHomeAddress(userID);
                    home.countryCode = LcRest.Locale.GetCountryCodeByID(countryID);
                    home.countryID = countryID;
                    LcRest.Address.SetAddress(home);

                    StartOnboardingForUser(userID);
                }

                // SIGNUP
                LcMessaging.SendMail("joshua.danielson@loconomics.com", "Sign-up", String.Format(@"
                    <html><body><h3>Sign-up.</h3>
                    <strong>This user was already in the database, is re-registering itself again!</strong><br/>
                    <dl>
                    <dt>Profile:</dt><dd>{0}</dd>
                    <dt>First Name:</dt><dd>{1}</dd>
                    <dt>Last Name:</dt><dd>{2}</dd>
                    <dt>Country:</dt><dd>{5}</dd>
                    <dt>Email:</dt><dd>{3}</dd>
                    <dt>UserID:</dt><dd>{4}</dd>
                    <dt>Phone:</dt><dd>{6}</dd>
                    </dl>
                    </body></html>
                ", profileTypeStr, firstName, lastName, email, logged.userID, countryID, phone));

                return logged;
            }
            else
            {
                if (useFacebookConnect)
                {
                    // Verify Facebook ID and accessToken contacting to Facebook Servers
                    if (LcFacebook.GetUserFromAccessToken(facebookUserID.ToString(), facebookAccessToken) == null)
                    {
                        throw new HttpException(400, "[[[Facebook account does not exists.]]]");
                    }
                }

                var registered = LcAuth.RegisterUser(email, firstName, lastName, password,
                    isServiceProfessional, utm, -1, null, phone, null, countryID);

                // Create a home address record almost with the country
                var home = LcRest.Address.GetHomeAddress(registered.UserID);
                home.countryCode = LcRest.Locale.GetCountryCodeByID(countryID);
                home.countryID = countryID;
                LcRest.Address.SetAddress(home);

                if (useFacebookConnect)
                {
                    // Register connection between the new account and the Facebook account
                    LcAuth.ConnectWithFacebookAccount(registered.UserID, facebookUserID);
                }

                // Welcome and confirmation e-mail
                LcAuth.SendRegisterUserEmail(registered);

                // SIGNUP
                LcMessaging.SendMail("joshua.danielson@loconomics.com", "Sign-up", String.Format(@"
                    <html><body><h3>Sign-up.</h3>
                    <dl>
                    <dt>Profile:</dt><dd>{0}</dd>
                    <dt>First Name:</dt><dd>{1}</dd>
                    <dt>Last Name:</dt><dd>{2}</dd>
                    <dt>Country:</dt><dd>{5}</dd>
                    <dt>Email:</dt><dd>{3}</dd>
                    <dt>UserID:</dt><dd>{4}</dd>
                    <dt>Phone:</dt><dd>{6}</dd>
                    </dl>
                    </body></html>
                ", profileTypeStr, firstName, lastName, email, registered.UserID, countryID, phone));

                // Auto login:
                return Login(email, password, false, returnProfile, true);
            }
        }
        else
        {
            // Bad request, input data incorrect because of validation rules
            throw new HttpException(400, LcRessources.ValidationSummaryTitle);
        }
    }
    #endregion

    #region Facebook
    public static LoginResult FacebookLogin(WebPage page, bool createAccount = false, bool isProvider = false)
    {
        var returnProfile = Request.Form["returnProfile"].AsBool();

        // Get Facebook User using the Request["accessToken"],
        // or signed_request or cookie.
        var fbuser = LcFacebook.GetUserFromCurrentRequest();
        var fuserid = fbuser != null ? ((string)fbuser["id"] ?? "0").AsLong() : 0;
        if (fuserid > 0) {
            // It exists?
            var user = LcAuth.GetFacebookUser(fuserid);
            if (user != null)
            {
                // Become provider
                if (createAccount && isProvider)
                {
                    LcAuth.BecomeProvider(user.UserID);
                    user.IsProvider = true;
                    LcAuth.SendRegisterUserEmail(user);
                }
            }
            else
            {
                if (createAccount)
                {
                    user = CreateFacebookAccount(fbuser, isProvider);
                }
                else
                {
                    throw new HttpException(400, "[[[Incorrect user]]]");
                }
            }

            // Performs system login, using the autologin info since
            // there is no password here.
            var ret = GetLoginResultForID(new LcAuth.UserAuthorization
            {
                userID = user.UserID,
                token = LcAuth.RegisterAuthorizationForUser(user.UserID)
            }, returnProfile);
            LcAuth.Autologin(ret.userID.ToString(), ret.authKey);
            return ret;
        }
        else {
            throw new HttpException(500, "[[[Invalid Facebook credentials]]]");
        }
    }

    private static LcAuth.RegisteredUser CreateFacebookAccount(dynamic facebookUser, bool isProvider)
    {
        // Create user with Facebook
        var result = LcAuth.RegisterUser(
            facebookUser.email,
            facebookUser.first_name,
            facebookUser.last_name,
            LcAuth.GeneratePassword(),
            isProvider,
            Request.Url.Query,
            //,facebookUser.gender
            -1,
            null,
            null,
            null,
            0
        );
        LcAuth.ConnectWithFacebookAccount(result.userID, facebookUser.id);
        LcAuth.SendRegisterUserEmail(result);
        return result;
    }

    public static LoginResult FacebookSignup(WebPage page)
    {
        var profileTypeStr = Request.Form["profileType"] ?? "";
        var isProvider = SERVICE_PROFESSIONAL_TYPE == profileTypeStr.ToUpper();

        return FacebookLogin(page, true, isProvider);
    }
    #endregion
}
