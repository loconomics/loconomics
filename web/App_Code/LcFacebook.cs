using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using System.Web.SessionState;
using System.Net;
using ASP;

/// <summary>
/// Facebook Utilities to verify logins and connections,
/// analizying signed requests and cookies,
/// communicating with Facebook Graph API
/// </summary>
public static class LcFacebook
{
    #region Web Context
    static HttpSessionState Session
    {
        get
        {
            return HttpContext.Current.Session;
        }
    }
    static HttpRequest Request
    {
        get
        {
            return HttpContext.Current.Request;
        }
    }
    #endregion

    #region Signed Request
    #region Generic utilities
    static string Base64UrlDecode(string input)
    {
        try
        {
            string decodedJson = input.Replace("=", string.Empty).Replace('-', '+').Replace('_', '/');
            return System.Text.UTF8Encoding.UTF8.GetString(
                Convert.FromBase64String(
                    decodedJson.PadRight(decodedJson.Length + (4 - decodedJson.Length % 4) % 4, '=')
                )
            );
        }
        catch {}
        return "";
    }
    #endregion

    static dynamic ParseSignedRequest(string cookieSignedRequest)
    {
        // cookieSignedRequest: encoded_sig + "." + payload
        var list = cookieSignedRequest.Split('.');
        
        var data = Json.Decode(Base64UrlDecode(list[1]));
        
        // There is no the recommended validation checking ensuring that encoded_sig (list[0]) match
        // the data object after apply a sha256 hash.
        // (see: https://github.com/facebook/php-sdk/blob/master/src/base_facebook.php)

        return data;
    }
    
    static dynamic GetSignedRequest()
    {
        
        dynamic sr = Session["facebookUserSignedRequest"];
        
        if (sr == null)
        {
            string strSR = Request["signed_request"];
            if (strSR == null)
            {
                // We need to read the user Facebook Cookie to get the user access_token
                var cookie_name = "fbsr_" + Facebook.AppId;

                if (Request.Cookies.AllKeys.Contains<string>(cookie_name))
                    strSR = Request.Cookies[cookie_name].Value;
            }

            if (N.W(strSR) != null)
            {
                // cookie_value is the Facebook Signed Request (fbsr), we must parse it
                sr = ParseSignedRequest(strSR);
            }
            
            if (sr != null)
            {
                Session["facebookUserId"] = N.W(sr.user_id) ?? "me";
            }
            
            Session["facebookUserSignedRequest"] = sr;
        }
        return sr;
    }
    #endregion

    #region Access Token
    static string GetUserAccessToken()
    {
        var token = Request["access_token"] ?? Request["accessToken"];
        if (!String.IsNullOrEmpty(token))
        {
            return token;
        }
        else
        {
            var signed_request = GetSignedRequest();

            if (signed_request != null)
            {
                if (signed_request.oauth_token != null)
                    return signed_request.oauth_token;
                else
                    return GetAccessTokenFromCode(N.W(signed_request.code) ?? Request["code"] ?? "");
            }
        }
        return null;
    }

    static string GetAccessTokenFromCode(string code)
    {
        // Do a server request to Facebook to interchange the CODE for a valid acces_token (to get the user information later)
        WebClient browser = new WebClient();
        // bugfix: 'type=client_cred' query parameter is required but not documented at facebook!*^!:-S||
        var url = String.Format(
            "https://graph.facebook.com/oauth/access_token?type=client_cred&client_id={0}&redirect_uri={1}&client_secret={2}&code={3}",
            (Facebook.AppId),     // YOUR_APP_ID
            HttpUtility.UrlEncode(LcUrl.LangUrl),   // YOUR_REDIRECT_URI
            (Facebook.AppSecret), // YOUR_APP_SECRET
            HttpUtility.UrlEncode(code)
        );  // CODE_GENERATED_BY_FACEBOOK

        try
        {
            var response = browser.DownloadString(url);
            // Response is OK (throw exception if not)
            // The result is a string in queryString format as the template:
            //  access_token=USER_ACESS_TOKEN&expires=NUMBER_OF_SECONDS_UNTIL_TOKEN_EXPIRES
            var query = HttpUtility.ParseQueryString(response, System.Text.Encoding.UTF8);
            return query["access_token"];
        }
        catch {}
        return null;
    }

    static dynamic GetUserFromAccessToken(string userAccessToken)
    {
        try
        {
            var browser = new WebClient();
            // Do a server request to Facebook to get the user information
            var url = String.Format(
                "https://graph.facebook.com/{0}?access_token={1}", //&fields=id,name,first_name,last_name,gender,about",
                Session["facebookUserId"] ?? "me",
                (userAccessToken)
            ); // YOUR_USER_ACCESS_TOKEN
                
            var response = browser.DownloadString(url);
            //Response.Write(url + "<br/>\n" + response);
            //Response.End();
            // Response is OK (throw exception if not)
            return Json.Decode(response);
        }
        catch {}
        return null;
    }
    #endregion

    #region Public API
    public static dynamic GetUserFromCurrentRequest()
    {
        string userAccessToken = GetUserAccessToken();
        return GetUserFromAccessToken(userAccessToken);
    }
    #endregion
}
