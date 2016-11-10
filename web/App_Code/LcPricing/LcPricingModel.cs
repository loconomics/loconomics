using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;
using System.Web.WebPages;
using System.Web.Helpers;
using System.Text;

/// <summary>
/// Models for LcPricingView views. AKA 'Pricing Estimate' or 'Booking Pricing Details'
/// </summary>
[Obsolete("Do NOT work because DB changes and business logic changes: Use LcRest.PricingSummary/Detail methods for load/save/calculate. There are some TODOs there still, for managing surcharges/variables/pricing-mods")]
public static partial class LcPricingModel
{
    #region Utilities
    private static HttpRequest Request
    {
        get
        {
            return HttpContext.Current.Request;
        }
    }
    #endregion
}