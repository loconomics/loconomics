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
        public dynamic profile;
    }

    public static LoginResult Login(WebPage page) {

        if (page.Validation.GetHtml("username") == null) {
            page.Validation.RequireField("username", "You must specify a user name.");
        }
        if (page.Validation.GetHtml("password") == null) {
	        page.Validation.RequireField("password", "You must specify a password.");
        }
        
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

    public static LoginResult Login(string username, string password, bool rememberMe = false, bool returnProfile = false, bool allowUnconfirmed = false) {
            
        checkAccountIsLocked(username);
        if (!allowUnconfirmed)
            checkAccountIsConfirmed(username);
            
        if (LcAuth.Login(username, password, rememberMe)) {
            
            var userId = WebSecurity.GetUserId(username);
            return GetLoginResultForID(userId, returnProfile);
        }
        else {
            throw new HttpException(400, "Incorrect Username or password.");
        }
    }

    private static LoginResult GetLoginResultForID(int userID, bool returnProfile)
    {
        var authKey = LcAuth.GetAutologinKey(userID);
        object profile = null;
            
        if (returnProfile) {
            profile = LcRestUserProfile.GetUserProfile(userID);
        }

        return new LoginResult {
            redirectUrl = getRedirectUrl(userID),
            userID = userID,
            authKey = authKey,
            profile = profile
        };
    }
    #endregion

    #region Logout
    public static void Logout() {
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
    
    public static void checkAccountIsLocked(string username) {
        
        if (WebSecurity.UserExists(username) && 
            WebSecurity.GetPasswordFailuresSinceLastSuccess(username) > 4 && 
            WebSecurity.GetLastPasswordFailureDate(username).AddSeconds(60) > DateTime.UtcNow) {

            //throw new HttpException(303, LcUrl.LangPath + "Account/AccountLockedOut/");
            /// http 409:Conflict
            throw new HttpException(409, "Your account has been locked due to too many unsuccessful login attempts.\n " +
                "Please try logging in again after 60 minutes.");
        }
    }

    public static void checkAccountIsConfirmed(string username) {
        
        // #454: User is auto-logged on registering, allowing it to do the Onboarding,
        // But next times, it is required to confirm email before logged.
        // Since we set IsConfirmed as true on database to let 'auto-logging on register', 
        // we must check for the existance of a confirmation token:
        var userId = WebSecurity.GetUserId(username);
        string token = userId == -1 ? null :
            Database
            .Open("sqlloco")
            // coalesce used to avoid the value 'DbNull' to be returned, just 'empty' when there is no token,
            // is already confirmed
            .QueryValue("SELECT coalesce(ConfirmationToken, '') FROM webpages_Membership WHERE UserID=@0", userId);

        if (userId > -1 && !string.IsNullOrWhiteSpace(token)) {
            // Resend confirmation mail
            var confirmationUrl = LcUrl.LangUrl + "Account/Confirm/?confirmationCode=" + HttpUtility.UrlEncode(token ?? "");
            
            var isProvider = Database
                .Open("sqlloco")
                .QueryValue("SELECT IsProvider FROM users WHERE UserID=@0", userId);

            if (isProvider) {
                LcMessaging.SendWelcomeProvider(userId, username, confirmationUrl);
            } else {
                LcMessaging.SendWelcomeCustomer(userId, username, confirmationUrl, token);
            }
            
            /// http 409:Conflict
            throw new HttpException(409, "Your account has not yet been confirmed. Please check your inbox and spam folders and click on the e-mail sent.");
        }
    }
    #endregion

    #region Signup
    public static LoginResult Signup(WebPage page) {

        if (page.Validation.GetHtml("username") == null) {
            page.Validation.RequireField("username", "You must specify an email.");
            // Username is an email currently, so need to be restricted
            page.Validation.Add("username",
                Validator.Regex(LcValidators.EmailAddressRegexPattern, "The email is not valid."));
        }
        if (page.Validation.GetHtml("password") == null) {
	        page.Validation.RequireField("password", "You must specify a password.");
        }
        
        if (page.Validation.IsValid()) {
            var username = Request.Form["username"];
            var password = Request.Form["password"];
            var rememberMe = Request.Form["rememberMe"].AsBool();
            var returnProfile = Request.Form["returnProfile"].AsBool();
            var profileTypeStr = Request.Form["profileType"] ?? "";
            var isProvider = new string[] { "FREELANCE", "FREELANCER", "PROVIDER" }.Contains(profileTypeStr.ToUpper());
            var utm = Request.Url.Query;

            // If the user exists, try to log-in with the given password,
            // becoming a provider if that was the requested profileType and follow as 
            // a normal login.
            // If the password didn't match, throw a sign-up specific error (email in use)
            // Otherwise, just register the user.
            if (LcAuth.ExistsEmail(username))
            {
                // Try Login
                try
                {
                    var logged = Login(username, password, rememberMe, returnProfile);
                    // throw exception on error
                    if (isProvider) {
                        LcAuth.BecomeProvider(logged.userID);
                    }
                    return logged;
                }
                catch (HttpException ex)
                {
                    // Not valid log-in, throw a 'email exists' error with Conflict http code
                    throw new HttpException(409, "Email address is already in use.");
                }
            }
            else
            {
                var registered = LcAuth.RegisterUser(username, "", "", password, isProvider, utm);
                LcAuth.SendRegisterUserEmail(registered);
                // Auto login:
                return Login(username, password, rememberMe, returnProfile, true);
            }
        }
        else {
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
                    throw new HttpException(400, "Incorrect user");
                }
            }

            // Performs system login, using the autologin info since
            // there is no password here.
            var ret = GetLoginResultForID(user.UserID, returnProfile);
            LcAuth.Autologin(ret.userID.ToString(), ret.authKey);
            return ret;
        }
        else {
            throw new HttpException(500, "Invalid Facebook credentials");
        }
    }

    private static LcAuth.RegisteredUser CreateFacebookAccount(dynamic facebookUser, bool isProvider)
    {
        // Create user with Facebook
        return LcAuth.RegisterUser(
            facebookUser.email,
            facebookUser.first_name,
            facebookUser.last_name,
            Membership.GeneratePassword(14, 5),
            isProvider,
            Request.Url.Query
            //,facebookUser.gender
        );
    }

    public static LoginResult FacebookSignup(WebPage page)
    {
        var profileTypeStr = Request.Form["profileType"] ?? "";
        var isProvider = new string[] { "FREELANCE", "FREELANCER", "PROVIDER" }.Contains(profileTypeStr.ToUpper());

        return FacebookLogin(page, true, isProvider);
    }
    #endregion
}