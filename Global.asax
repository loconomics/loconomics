<%@ Application Language="C#" %>

<script runat="server">

    void Application_Start(object sender, EventArgs e) 
    {
        // Código que se ejecuta al iniciarse la aplicación

    }
    
    void Application_End(object sender, EventArgs e) 
    {
        //  Código que se ejecuta cuando se cierra la aplicación

    }
        
    void Application_Error(object sender, EventArgs e) 
    { 
        // Código que se ejecuta al producirse un error no controlado

    }

    void Session_Start(object sender, EventArgs e) 
    {
        // We check if user browser sent an auth cookie (lcAuth), if is a non persistent cookie
        // (have not expired date), we force logout; this is how non persistent sessions die
        // when server-session timeout dies, sharing this configurable time 
        // (web.config/system.web/sessionState/timeout)
        // NOTE: Response.Write lines are debug code.
        var c = Request.Cookies[FormsAuthentication.FormsCookieName]; //["lcAuth"];
        if (c != null)
        {
            var t = FormsAuthentication.Decrypt(c.Value);
            if (!t.IsPersistent)
            {
                // Non persistent
                //Response.Write("session cookie!");
                WebMatrix.WebData.WebSecurity.Logout();
            }
            /*else
            {
                // persistent
                Response.Write("persistent cookie until: " + t.Expiration.ToString());
            }*/
        }
        
    }

    void Session_End(object sender, EventArgs e) 
    {
        // Código que se ejecuta cuando finaliza una sesión. 
        // Nota: El evento Session_End se desencadena sólo con el modo sessionstate
        // se establece como InProc en el archivo Web.config. Si el modo de sesión se establece como StateServer 
        // o SQLServer, el evento no se genera.

    }

    void Application_BeginRequest(object sender, EventArgs e)
    {
        // TODO: This culture setting must be setted using the user preference at
        // Session_Start, when select a language form the dropdown or after login with
        // database preferences.
        System.Threading.Thread.CurrentThread.CurrentCulture =
        System.Threading.Thread.CurrentThread.CurrentUICulture = 
        System.Globalization.CultureInfo.CreateSpecificCulture("en-US");
        
        // Autologin
        LcAuth.RequestAutologin(Request);
    }
    void Application_EndRequest(object sender, EventArgs e)
    {
        LcData.UserInfo.RegisterLastActivityTime();
        /* TESTING
        using (var f = System.IO.File.AppendText(Request.MapPath(LcUrl.RenderAppPath + "EndRequest.log")))
        {
            f.WriteLine("EXECUTION: " + (HttpContext.Current.Handler.GetType()).ToString());
        } */
    }
       
</script>
