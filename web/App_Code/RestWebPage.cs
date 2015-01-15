using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Base class to simplify implementation of REST pages
/// throught asp.net WebPages framework (.cshtml).
/// 
/// This class must be inherit implementing the methods 
/// supported (GET, POST, PUT or DELETE), and gets
/// executed by make an instance of the subclass
/// and executing Run or JsonResponse with a reference
/// to the WebPage object (in .cshtml files is the 'this'
/// reference).
/// </summary>
public class RestWebPage
{
    public System.Web.WebPages.WebPage WebPage;

    public HttpRequestBase Request
    {
        get
        {
            return WebPage.Request;
        }
    }
    public System.Web.WebPages.Html.ModelStateDictionary ModelState
    {
        get
        {
            return WebPage.ModelState;
        }
    }
    public System.Web.WebPages.ValidationHelper Validation
    {
        get
        {
            return WebPage.Validation;
        }
    }
    public IList<string> UrlData
    {
        get
        {
            return WebPage.UrlData;
        }
    }
    public int StatusCode
    {
        get
        {
            return WebPage.Response.StatusCode;
        }
        set
        {
            WebPage.Response.StatusCode = value;
        }
    }

    public virtual dynamic Get()
    {
        throw new HttpException(405, "GET is not allowed");
    }
    public virtual dynamic Post()
    {
        throw new HttpException(405, "POST is not allowed");
    }
    public virtual dynamic Put()
    {
        throw new HttpException(405, "PUT is not allowed");
    }
    public virtual dynamic Delete()
    {
        throw new HttpException(405, "DELETE is not allowed");
    }

    /// <summary>
    /// Executes the page code of the desired method
    /// and returns an object with the result.
    /// That result must be piped to the response manually
    /// (or use JsonResponse).
    /// </summary>
    /// <param name="WebPage"></param>
    /// <returns></returns>
    public dynamic Run(System.Web.WebPages.WebPage WebPage)
    {
        this.WebPage = WebPage;

        dynamic result = null;

        try
        {
            switch (Request.HttpMethod.ToUpper())
            {
                case "GET":
                    result = Get();
                    break;
                case "POST":
                    result = Post();
                    break;
                case "PUT":
                    result = Put();
                    break;
                case "DELETE":
                    result = Delete();
                    break;
                default:
                    throw new HttpException(405, String.Format("{0} is not allowed", Request.HttpMethod));
            }

        }
        catch (HttpException http)
        {
            result = new Dictionary<string, dynamic>();

            WebPage.Response.StatusCode = http.GetHttpCode();

            result["errorMessage"] = http.Message;
            if (!ModelState.IsValid)
            {
                result["errorSource"] = "validation";
                result["errors"] = ModelState.Errors();
            }

            if (WebPage.Response.StatusCode == 500)
            {
                if (ASP.LcHelpers.InDev)
                    result["exception"] = http;
                else
                    LcLogger.LogAspnetError(http);
            }
        }
        catch (Exception ex)
        {
            result = new Dictionary<string, dynamic>();
            result["errorMessage"] = ex.Message;

            if (ASP.LcHelpers.InDev)
                result["exception"] = ex;
            else
                LcLogger.LogAspnetError(ex);
        }

        return result;
    }

    /// <summary>
    /// Executes the page code of the desired method
    /// and send it as JSON to the Http Response.
    /// </summary>
    /// <param name="WebPage"></param>
    public void JsonResponse(System.Web.WebPages.WebPage WebPage)
    {
        ASP.LcHelpers.ReturnJson(Run(WebPage));
    }

    #region REST utilities
    /// <summary>
    /// Date format in ISO-8601, suitable for JSON
    /// </summary>
    public const string DateFormat = "yyyy'-'MM'-'dd";
    /// <summary>
    /// Time format in ISO-8601, suitable for JSON
    /// </summary>
    public const string TimeFormat = @"hh\:mm\:ss";
    /// <summary>
    /// Convert a date (in DateTime) in
    /// ISO string format, or null if not a correct value.
    /// </summary>
    /// <param name="date"></param>
    /// <returns></returns>
    public static string DateToISO(object date)
    {
        return (date is DateTime) ? ((DateTime)date).ToString(DateFormat) : null;
    }
    /// <summary>
    /// Convert a time (as TimeSpan or DateTime) in
    /// ISO string format, or null if not a correct value.
    /// </summary>
    /// <param name="time"></param>
    /// <returns></returns>
    public static string TimeToISO(object time)
    {
        return (time is DateTime) ? ((DateTime)time).TimeOfDay.ToString(TimeFormat) :
            (time is TimeSpan) ? ((TimeSpan)time).ToString(TimeFormat) :
            null;
    }
    public static string DateTimeToISO(object datetime)
    {
        var d = DateToISO(datetime);
        var t = TimeToISO(datetime);

        if (d != null && t != null)
        {
            return d + "T" + t;
        }
        else
        {
            return d != null ? d : t != null ? t : null;
        }
    }
    public static DateTime? DateTimeFromISO(string datetime)
    {
        DateTime dt;
        return (DateTime.TryParse(datetime, null, System.Globalization.DateTimeStyles.RoundtripKind, out dt)) ?
            (DateTime?)dt :
            null;
    }
    #endregion
}