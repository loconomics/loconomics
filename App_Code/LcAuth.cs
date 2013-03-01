using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using WebMatrix.WebData;
using WebMatrix.Security;

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
        string marketingSource = null
    ) {
        using (var db = Database.Open("sqlloco"))
        {
            // Insert email into the profile table
            db.Execute("INSERT INTO UserProfile (Email) VALUES (@0)", email);

            // Create and associate a new entry in the membership database (is connected automatically
            // with the previous record created using the automatic UserID generated for it).
            var token = WebSecurity.CreateAccount(email, password, true);

            // Create Loconomics Customer user
            int userid = WebSecurity.GetUserId(email);
            db.Execute("exec CreateCustomer @0,@1,@2,@3,@4",
                userid, firstname, lastname, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

            // If is provider, update profile with that info (being both customer and provider)
            if (isProvider)
            {
                db.Execute("UPDATE Users SET IsProvider = 1 WHERE UserID = @0", userid);
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

            // All done:
            return new RegisteredUser {
                UserID = userid,
                Email = email,
                ConfirmationToken = token,
                IsProvider = isProvider
            };
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
    public static void Login(string email, string password)
    {
        // Navigate back to the homepage and exit
        WebSecurity.Login(email, password);

        // mark the user as logged in via a normal account,
        // as opposed to via an OAuth or OpenID provider.
        System.Web.HttpContext.Current.Session["OAuthLoggedIn"] = false;
    }
}