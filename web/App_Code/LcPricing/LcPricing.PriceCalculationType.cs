using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    [Obsolete("Moved to LcEnum.PriceCalculationType")]
    public enum PriceCalculationType : short
    {
        FixedPrice,
        HourlyPrice
    }
}