<%@ Application Language="C#" %>

<script runat="server">

    void Application_Start(object sender, EventArgs e) 
    {
        // Code that runs on application startup
        i18n.LocalizedApplication.Current.TweakMessageTranslation = delegate(System.Web.HttpContextBase context, i18n.Helpers.Nugget nugget, i18n.LanguageTag langtag, string message)
        {
            switch (context.Response.ContentType)
            {
                case "application/javascript":
                    return message.Replace("\'", "\\'");
            }
            return message;
        };
    }
    
    void Application_End(object sender, EventArgs e) 
    {
        //  Code that runs on application shutdown

    }
        
    void Application_Error(object sender, EventArgs e) 
    { 
        // Code that runs when an unhandled error occurs

    }

    void Session_Start(object sender, EventArgs e) 
    {
        // Code that runs when a new session is started

    }

    void Session_End(object sender, EventArgs e) 
    {
        // Code that runs when a session ends. 
        // Note: The Session_End event is raised only when the sessionstate mode
        // is set to InProc in the Web.config file. If session mode is set to StateServer 
        // or SQLServer, the event is not raised.

    }

    void Application_BeginRequest(object sender, EventArgs e)
    {
        // TODO: This culture setting must be setted using the user preference at
        // Session_Start, when select a language form the dropdown or after login with
        // database preferences.
        System.Threading.Thread.CurrentThread.CurrentCulture =
        System.Threading.Thread.CurrentThread.CurrentUICulture = 
        System.Globalization.CultureInfo.CreateSpecificCulture(i18n.LocalizedApplication.Current.DefaultLanguage);
    }
       
</script>
