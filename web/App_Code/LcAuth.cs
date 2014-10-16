using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using WebMatrix.WebData;
using WebMatrix.Security;
using System.Web.WebPages;

/// <summary>
/// Utilities class about authentication and authorization,
/// covering account utilities (register, password,..) and access control.
/// TODO: To much of features that have better place here are located right now
/// on specific pages under Account/ folder or as wide used methods in generic LcHelpers
/// </summary>
public static class LcAuth
{
    public static bool ExistsEmail(string email)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QuerySingle("EXEC CheckUserEmail @0", email) != null;
        }
    }
    public class RegisteredUser
    {
        public string Email;
        public int UserID;
        public string ConfirmationToken;
        public bool IsProvider;
    }
    /// <summary>
    /// Register an user and returns relevant registration information about the new account,
    /// or raise and exception on error of type System.Web.Security.MembershipCreateUserException.
    /// </summary>
    /// <param name="email"></param>
    /// <param name="firstname"></param>
    /// <param name="lastname"></param>
    /// <param name="password"></param>
    /// <param name="isProvider"></param>
    /// <returns></returns>
    public static RegisteredUser RegisterUser(
        string email,
        string firstname,
        string lastname,
        string password,
        bool isProvider,
        string marketingSource = null,
        int genderID = -1,
        string aboutMe = null
    ) {
        using (var db = Database.Open("sqlloco"))
        {
            // IMPORTANT: The whole process must be complete or rollback, but since
            // a transaction cannot be done from the start because will collide
            // with operations done by WebSecurity calls, the first step must
            // be protected manually.
            string token = null;

            try
            {
                // Insert email into the profile table
                db.Execute("INSERT INTO UserProfile (Email) VALUES (@0)", email);

                // Create and associate a new entry in the membership database (is connected automatically
                // with the previous record created using the automatic UserID generated for it).
                token = WebSecurity.CreateAccount(email, password, true);
            }
            catch (Exception ex)
            {
                // Manual rollback previous operation:
                // If CreateAccount failed, nothing was persisted there so nothing require rollback,
                // only the UserProfile record
                db.Execute("DELETE FROM UserProfile WHERE Email like @0", email);

                // Relay exception
                throw ex;
            }

            // Create Loconomics Customer user
            int userid = WebSecurity.GetUserId(email);

            try
            {
                // Automatic transaction can be used now:
                db.Execute("BEGIN TRANSACTION");

                db.Execute("exec CreateCustomer @0,@1,@2,@3,@4,@5,@6",
                    userid, firstname, lastname,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(),
                    genderID, aboutMe
                );

                // If is provider, update profile with that info (being both customer and provider)
                // It assigns the first OnboardingStep 'welcome' for the new Onboarding Dashboard #454
                if (isProvider)
                {
                    BecomeProvider(userid, db);
                }

                // Partial email confirmation to allow user login but still show up email-confirmation-alert. Details:
                // IMPORTANT: 2012-07-17, issue #57; We decided use the email-confirmation-code only as a dashboard alert (id:15) instead of blocking the user
                // login, what means user MUST can login but too MUST have an email-confirmation-code; we do that reusing the confirmation code
                // created by asp.net starter-app as until now, but HACKING that system doing a minor change on database, in the 
                // asp.net webpages generated table called 'webpages_Membership': there are two fields to manage confirmation, a bit field (this
                // we will hack changing it to true:1 manually -before of time-) and the confirmationToken that we will mantain to allow user confirmation
                // from the welcome-email sent and to off the alert:15 (with custom code on the Account/Confirm page).
                db.Execute(@"
                    UPDATE webpages_Membership SET
                        IsConfirmed = 1
                    WHERE UserId = @0
                ", userid);

                // Log Marketing URL parameters
                if (marketingSource == null && System.Web.HttpContext.Current != null)
                    marketingSource = System.Web.HttpContext.Current.Request.Url.Query;
                if (marketingSource != null)
                    db.Execute("UPDATE users SET MarketingSource = @1 WHERE UserID = @0", userid, marketingSource);

                db.Execute("COMMIT TRANSACTION");

                // All done:
                return new RegisteredUser
                {
                    UserID = userid,
                    Email = email,
                    ConfirmationToken = token,
                    IsProvider = isProvider
                };
            }
            catch (Exception ex)
            {
                db.Execute("ROLLBACK TRANSACTION");

                throw ex;
            }
        }
    }
    public static void BecomeProvider(int userID, Database db = null)
    {
        var ownDb = db == null;
        if (ownDb)
        {
            db = Database.Open("sqlloco");
        }
        
        db.Execute(@"UPDATE Users SET 
            IsProvider = 1,
            OnboardingStep = 'welcome'
            WHERE UserID = @0
        ", userID);

        if (ownDb)
        {
            db.Dispose();
        }
    }
    public static void SendRegisterUserEmail(RegisteredUser user)
    {
        var confirmationUrl = LcUrl.LangUrl + "Account/Confirm/?confirmationCode=" + HttpUtility.UrlEncode(user.ConfirmationToken);
        // Sent welcome email (if there is a confirmationUrl and token values, the email will contain it to perform the required confirmation)
        if (user.IsProvider)
            LcMessaging.SendWelcomeProvider(user.UserID, user.Email, confirmationUrl);
        else
            LcMessaging.SendWelcomeCustomer(user.UserID, user.Email, confirmationUrl, user.ConfirmationToken);
    }

    public static void ConnectWithFacebookAccount(int userID, long facebookID)
    {
        using (var db = Database.Open("sqlloco")){

            // Create asociation between locouser and facebookuser
            db.Execute(string.Format("INSERT INTO {0} ({1}, {2}) VALUES (@0, @1)", "webpages_FacebookCredentials", "UserId", "FacebookId"), userID, facebookID);
                            
            // Add Facebook verification as confirmed
            db.Execute(@"EXEC SetUserVerification @0,@1,@2,@3", userID, 8, DateTime.Now, 1);
            // Test social media alert
            db.Execute("EXEC TestAlertSocialMediaVerification @0", userID);
        }
    }

    public static int? GetFacebookUserID(long facebookID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.QueryValue("SELECT UserId FROM webpages_FacebookCredentials WHERE FacebookId=@0", facebookID);
        }
    }

    /// <summary>
    /// Get basic user info given a Facebook User ID or null.
    /// </summary>
    /// <param name="facebookID"></param>
    public static RegisteredUser GetFacebookUser(long facebookID)
    {
        int? userId = GetFacebookUserID(facebookID);
        if (userId.HasValue)
        {
            var userData = LcData.UserInfo.GetUserRow(userId.Value);
            // Check is valid (only edge cases will not be a valid record,
            // as incomplete manual deletion of user accounts that didn't remove
            // the Facebook connection).
            if (userData != null)
            {
                return new RegisteredUser
                {
                    Email = userData.Email,
                    IsProvider = userData.IsProvider,
                    UserID = userId.Value
                };
            }
            return null;
        }
        else
        {
            return null;
        }
    }

    public static bool Login(string email, string password, bool persistCookie = false)
    {
        // Navigate back to the homepage and exit
        var result = WebSecurity.Login(email, password, persistCookie);

        LcData.UserInfo.RegisterLastLoginTime(0, email);

        // mark the user as logged in via a normal account,
        // as opposed to via an OAuth or OpenID provider.
        System.Web.HttpContext.Current.Session["OAuthLoggedIn"] = false;

        return result;
    }
    /// <summary>
    /// Check a user autologinkey to performs the automatic login if
    /// match.
    /// If success, the request continue being processing but with a
    /// new session and new authentication cookie being sent in the response.
    /// </summary>
    /// <param name="userid"></param>
    /// <param name="autologinkey"></param>
    public static void Autologin(string userid, string autologinkey)
    {
        try
        {
            using (var db = Database.Open("sqlloco"))
            {
                var p = db.QueryValue(@"
                    SELECT  Password
                    FROM    webpages_Membership
                    WHERE   UserId=@0
                ", userid);
                // Check if autologinkey and password (encrypted and then converted for url) match
                if (autologinkey == LcEncryptor.ConvertForURL(LcEncryptor.Encrypt(p)))
                {
                    // Autologin Success
                    // Get user email by userid
                    var userEmail = db.QueryValue(@"
                        SELECT  email
                        FROM    userprofile
                        WHERE   userid = @0
                    ", userid);
                    // Clear current session to avoid conflicts:
                    if (HttpContext.Current.Session != null)
                        HttpContext.Current.Session.Clear();
                    // New authentication cookie: Logged!
                    System.Web.Security.FormsAuthentication.SetAuthCookie(userEmail, false);

                    LcData.UserInfo.RegisterLastLoginTime(userid.AsInt(), userEmail);
                }
            }
        }
        catch (Exception ex) { HttpContext.Current.Response.Write(ex.Message); }
    }
    /// <summary>
    /// Get the key that enable the user to autologged from url, to
    /// be used by email templates.
    /// </summary>
    /// <param name="userid"></param>
    /// <returns></returns>
    public static string GetAutologinKey(int userid)
    {
        try
        {
            using (var db = Database.Open("sqlloco"))
            {
                var p = db.QueryValue(@"
                    SELECT  Password
                    FROM    webpages_Membership
                    WHERE   UserId=@0
                ", userid);
                return LcEncryptor.ConvertForURL(LcEncryptor.Encrypt(p));
            }
        }
        catch { }
        return null;
    }
    /// <summary>
    /// Request an autologin using the values from the HttpRequest if
    /// is need.
    /// </summary>
    public static void RequestAutologin(HttpRequest Request)
    {
        var Q = Request.QueryString;
        // Autologin feature for anonymous sessions with autologin parameters on request
        if (!Request.IsAuthenticated
            && Q["alk"] != null
            && Q["alu"] != null)
        {
            // 'alk' url parameter stands for 'Auto Login Key'
            // 'alu' url parameter stands for 'Auto Login UserID'
            LcAuth.Autologin(Q["alu"], Q["alk"]);
        }
    }
    /// <summary>
    /// Get for the given userID the params and values for autologin in URL string format,
    /// ready to be appended to an URL
    /// (without & or ? as prefix, but & as separator and last character).
    /// To be used mainly by Email templates.
    /// </summary>
    /// <returns></returns>
    public static string GetAutologinUrlParams(int userID)
    {
        return String.Format("alu={0}&alk={1}&",
            userID,
            GetAutologinKey(userID));
    }
}