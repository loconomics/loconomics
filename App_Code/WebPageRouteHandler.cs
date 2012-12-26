using System;
using System.Globalization;
using System.Web;
using System.Web.Routing;
using System.Web.WebPages;

public class WebPagesRouteHandler : IRouteHandler {
    private readonly string _virtualPath;
    private Route _routeVirtualPath;
   
    public WebPagesRouteHandler(string virtualPath) {
        _virtualPath = virtualPath;    
    }
   
    private Route RouteVirtualPath {
        get {
            if (_routeVirtualPath == null) {
                _routeVirtualPath = new Route(_virtualPath.Substring(2), this);
            }
            return this._routeVirtualPath;
        }
    }
   
    public IHttpHandler GetHttpHandler(RequestContext requestContext) {
        var substitutedVirtualPath = GetSubstitutedVirtualPath(requestContext);
        int index = substitutedVirtualPath.IndexOf('?');
        if (index != -1) {
            substitutedVirtualPath = substitutedVirtualPath.Substring(0, index);
        }
        requestContext.HttpContext.Items[ContextExtensions.RouteKey] = requestContext.RouteData.Values;
        return WebPageHttpHandler.CreateFromVirtualPath(substitutedVirtualPath);
    }
   
    public string GetSubstitutedVirtualPath(RequestContext requestContext) {
        VirtualPathData virtualPath = RouteVirtualPath.GetVirtualPath(requestContext, requestContext.RouteData.Values);
        if (virtualPath == null) {
            return _virtualPath;
        }
        return ("~/" + virtualPath.VirtualPath);
    }
}

public static class RouteCollectionExtension {
    public static void MapWebPageRoute(this RouteCollection routeCollection, string routeUrl, string virtualPath, object defaultValues = null, object constraints = null, string routeName = null) {
        routeName = routeName ?? routeUrl;
       
        Route item = new Route(routeUrl, new RouteValueDictionary(defaultValues), new RouteValueDictionary(constraints), new WebPagesRouteHandler(virtualPath));
        routeCollection.Add(routeName, item);
    }  
}

public static class ContextExtensions {
    internal const string RouteKey = "__Route";
    public static string GetRouteValue(this HttpContextBase context, string key) {
        var route = context.Items[RouteKey] as RouteValueDictionary;
        if (route != null) {
            var routeValue = route[key];
            return routeValue != null ? routeValue.ToString() : null;
        }
        return null;
    }
}