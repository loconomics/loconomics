using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    /// <summary>
    /// Enum for the different calculation logic or constraint rules to apply
    /// to pricing types.
    /// </summary>
    public enum PriceCalculationType : short
    {
        FixedPrice,
        HourlyPrice
    }
}