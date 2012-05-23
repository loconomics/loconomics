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
        // Código que se ejecuta cuando se inicia una nueva sesión

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

        if (HttpContext.Current.Request.IsSecureConnection == false && 
            HttpContext.Current.Request.IsLocal == false)
        {
            Response.Redirect("https://" + Request.ServerVariables["HTTP_HOST"]
            + HttpContext.Current.Request.RawUrl);
        }
    }
    void Application_EndRequest(object sender, EventArgs e)
    {
        
    }
       
</script>
