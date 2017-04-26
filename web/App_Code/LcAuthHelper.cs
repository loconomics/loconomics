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
        public string onboardingStep;
    }

    public static LoginResult Login(WebPage page) {

        page.Validation.RequireField("username", "You must specify a user name.");
	    page.Validation.RequireField("password", "You must specify a password.");
        
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
            
        if (LcAuth.Login(username, password, rememberMe)) {
            
            var userId = WebSecurity.GetUserId(username);
            return GetLoginResultForID(userId, returnProfile);
        }
        else {
            throw new HttpException(400, "Incorrect username or password.");
        }
    }

    private static LoginResult GetLoginResultForID(int userID, bool returnProfile)
    {
        var authKey = LcAuth.GetAutologinKey(userID);
        LcRest.UserProfile profile = null;
            
        if (returnProfile) {
            profile = LcRest.UserProfile.Get(userID);
        }

        return new LoginResult {
            redirectUrl = getRedirectUrl(userID),
            userID = userID,
            authKey = authKey,
            profile = profile,
            onboardingStep = profile == null ? null : profile.onboardingStep
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
                throw new HttpException(409, "Your account has not yet been confirmed. Please check your inbox and spam folders and click on the e-mail sent.");
            }
        }
    }
    #endregion

    #region Signup
    const int COUNTRY_CODE_USA = 1;
    const string SERVICE_PROFESSIONAL_TYPE = "SERVICE-PROFESSIONAL";

    /// <summary>
    /// Signup with fields:
    /// - email [required]
    /// - password [required when no facebookUserID is given]
    /// - facebookUserID [optional]
    /// - countryID [optional defaults to COUNTRY_CODE_USA]
    /// - profileType [optional defaults to client]
    /// - utm [optional, not a named form parameter but the whole query string]
    /// - firstName [optional]
    /// - lastName [optional]
    /// - postalCode [optional]
    /// - referralCode [optional]
    /// - device [optional]
    /// - phone [optional]
    /// - returnProfile [optional defaults to false] Returns the user profile in a property of the result
    /// </summary>
    /// <param name="page"></param>
    /// <returns></returns>
    public static LoginResult Signup(WebPage page)
    {
        page.Validation.RequireField("email", "You must specify an email.");
        // Username is an email currently, so need to be restricted
        page.Validation.Add("email",
            Validator.Regex(LcValidators.EmailAddressRegexPattern, "The email is not valid."));

        // First data
        var profileTypeStr = Request.Form["profileType"] ?? "";
        var isServiceProfessional = SERVICE_PROFESSIONAL_TYPE == profileTypeStr.ToUpper();
        var facebookUserID = Request.Form["facebookUserID"].AsLong(0);
        var facebookAccessToken = Request.Form["facebookAccessToken"];
        var email = Request.Form["email"];

        // Conditional validations
        var useFacebookConnect = facebookUserID > 0 && !String.IsNullOrEmpty(facebookAccessToken);
        if (!useFacebookConnect) {
            page.Validation.RequireField("password", "You must specify a password.");
            page.Validation.Add("password", new PasswordValidator());
        }

        if (useFacebookConnect)
        {
            var prevFbUser = LcAuth.GetFacebookUser(facebookUserID);
            if (prevFbUser != null)
            {
                throw new HttpException(409, "Facebook account already connected. Sign in.");
            }
        }

        if (page.Validation.IsValid())
        {
            var postalCode = Request.Form["postalCode"];
            // TODO To use countryCode for a more 'open' public REST API, where 'code' is a well know ISO 2-letters CODE
            //var countryCode = Request.Form["countryCode"] ?? "US";
            var countryID = Request.Form["countryID"].AsInt(COUNTRY_CODE_USA);

            // Postal code is Optional
            if (!String.IsNullOrEmpty(postalCode))
            {
                // Validate postal code before continue
                var add = new LcRest.Address
                {
                    postalCode = postalCode,
                    //countryCode = countryCode
                    countryID = countryID
                };
                if (!LcRest.Address.AutosetByCountryPostalCode(add))
                {
                    // bad postal code
                    page.ModelState.AddError("postalCode", "Invalid postal code");
                    throw new HttpException(400, LcRessources.ValidationSummaryTitle);
                }
            }

            // Autogenerated password (we need to save one) on facebook connect:
            var password = useFacebookConnect ? LcAuth.GeneratePassword() : Request.Form["password"];
            var firstName = Request.Form["firstName"];
            var lastName = Request.Form["lastName"];
            var referralCode = Request.Form["referralCode"];
            var device = Request.Form["device"];
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
                // If the email exists, we try to log-in using the provided password, to don't bother with "e-mail in use" error 
                // if the user provides the correct credentials (maybe just don't remember he/she has already an account; make it easy for them
                // to return).
                // BUT we have a special situation that needs extra checks:
                // CLIENT--CONFIRMATION LOGIC
                // The email can exists because the user has an account created as client by a service professional:
                // - A: On that cases, we need to communicate that specific situation (error message), generate a confirmation code
                // for the existent user, send email to let him to confirm it owns the given e-mail.
                // - B: On returning here after point A, a confirmation code is provided and we must proceed
                // by checking the confirmation code and, on success, unlock and update the membership password and
                // continue updating any given data.
                var userID = WebSecurity.GetUserId(email);
                var user = LcRest.UserProfile.Get(userID);
                if (user.accountStatusID != (int)LcEnum.AccountStatus.serviceProfessionalClient)
                {
                    // NOT a client, just standard sign-up that requires verify the email/password or fail
                    // Try Login
                    try
                    {
                        logged = Login(email, password, false, returnProfile, true);
                        userID = logged.userID;
                        // throw exception on error
                        if (isServiceProfessional)
                        {
                            LcAuth.BecomeProvider(userID);
                        }
                    }
                    catch (HttpException)
                    {
                        // Not valid log-in, throw a 'email exists' error with Conflict http code
                        throw new HttpException(409, "E-mail address is already in use.");
                    }
                }
                else
                {
                    // CLIENT--CONFIRMATION LOGIC
                    // The email can exists because the user has an account created as client by a service professional:
                    // - A: On that cases, we need to communicate that specific situation (error message), generate a confirmation code
                    // for the existent user, send email to let him to confirm it owns the given e-mail.
                    // - B: On returning here after point A, a confirmation code is provided and we must proceed
                    // by checking the confirmation code and, on success, unlock and update the membership password and
                    // continue updating any given data.
                    var confirmationCode = Request["confirmationCode"];
                    var errMsg = String.Format(@"We see one of our service professionals has already scheduled services for you in the past.
                        We've just sent an invitation to create your account to {0}.
                        Please follow its instructions. We can't wait to get you on board!", email
                    );
                    if (String.IsNullOrEmpty(confirmationCode))
                    {
                        // Point A: create confirmation code  
                        // generate a confirmation code (creates the Membership record, that does not exists still since is as just a client)
                        // this needs a random password (we still didn't verified the user, so do NOT trust on the given password).
                        // NOTE: since this can be attempted several time by the user, and next attempts will fail because the Membership
                        // record will exists already, just double check and try creation only if record don't exists:
                        if (!LcAuth.HasMembershipRecord(userID))
                        {
                            WebSecurity.CreateAccount(email, LcAuth.GeneratePassword(), true);
                        }
                        // send email to let him to confirm it owns the given e-mail
                        LcMessaging.SendWelcomeCustomer(userID, email);
                        // Not valid after all, just communicate was was done and needs to do to active its account:
                        throw new HttpException(409, errMsg);
                    }
                    else
                    {
                        // Point B: confirm confirmation code
                        if (LcAuth.GetConfirmationToken(userID) == confirmationCode)
                        {
                            // We know is valid, we can update the accountStatus to not be any more a "service professional's client"
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
                    logged = Login(email, password, false, returnProfile, false);
                }

                // Update account data with the extra information.
                using (var db = new LcDatabase())
                {
                    db.Execute(@"
                        UPDATE users SET
                            firstName = coalesce(@1, firstName),
                            lastName = coalesce(@2, lastName),
                            mobilePhone = coalesce(@3, mobilePhone),
                            signupDevice = coalesce(@4, signupDevice)
                        WHERE userID = @0
                    ", userID, firstName, lastName, phone, device);

                    var address = LcRest.Address.GetHomeAddress(userID);
                    if (address.postalCode != postalCode)
                    {
                        address.postalCode = postalCode;
                        //address.countryCode = countryCode;
                        address.countryCode = LcRest.Locale.GetCountryCodeByID(countryID);
                        address.countryID = countryID;
                        LcRest.Address.SetAddress(address);
                    }
                }

                // SIGNUP
                LcMessaging.SendMail("joshua.danielson@loconomics.com", "Sign-up", String.Format(@"
                    <html><body><h3>Sign-up.</h3>
                    <strong>This user was already in the database, is re-registering itself again!</strong><br/>
                    <dl>
                    <dt>Profile:</dt><dd>{0}</dd>
                    <dt>First Name:</dt><dd>{1}</dd>
                    <dt>Last Name:</dt><dd>{2}</dd>
                    <dt>Postal code:</dt><dd>{3}</dd>
                    <dt>Country:</dt><dd>{9}</dd>
                    <dt>Referral code:</dt><dd>{4}</dd>
                    <dt>Device:</dt><dd>{5}</dd>
                    <dt>Phone:</dt><dd>{6}</dd>
                    <dt>Email:</dt><dd>{7}</dd>
                    <dt>UserID:</dt><dd>{8}</dd>
                    </dl>
                    </body></html>
                ", profileTypeStr, firstName, lastName, postalCode, referralCode, device, phone, email, logged.userID, countryID));

                return logged;
            }
            else
            {
                if (useFacebookConnect)
                {
                    // Verify Facebook ID and accessToken contacting to Facebook Servers
                    if (LcFacebook.GetUserFromAccessToken(facebookUserID.ToString(), facebookAccessToken) == null)
                    {
                        throw new HttpException(400, "Facebook account does not exists.");
                    }
                }

                var registered = LcAuth.RegisterUser(email, firstName, lastName, password, isServiceProfessional, utm, -1, null, phone, device);
                if (!String.IsNullOrEmpty(postalCode))
                {
                    // Set address
                    var address = LcRest.Address.GetHomeAddress(registered.UserID);
                    address.postalCode = postalCode;
                    //address.countryCode = countryCode;
                    address.countryCode = LcRest.Locale.GetCountryCodeByID(countryID);
                    address.countryID = countryID;
                    LcRest.Address.SetAddress(address);
                }

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
                    <dt>Postal code:</dt><dd>{3}</dd>
                    <dt>Country:</dt><dd>{9}</dd>
                    <dt>Referral code:</dt><dd>{4}</dd>
                    <dt>Device:</dt><dd>{5}</dd>
                    <dt>Phone:</dt><dd>{6}</dd>
                    <dt>Email:</dt><dd>{7}</dd>
                    <dt>UserID:</dt><dd>{8}</dd>
                    </dl>
                    </body></html>
                ", profileTypeStr, firstName, lastName, postalCode, referralCode, device, phone, email, registered.UserID, countryID));

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
        var result = LcAuth.RegisterUser(
            facebookUser.email,
            facebookUser.first_name,
            facebookUser.last_name,
            LcAuth.GeneratePassword(),
            isProvider,
            Request.Url.Query
            //,facebookUser.gender
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