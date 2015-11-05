using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    [Obsolete("Not needed on new workflow (REST API, internal LcRest API)")]
    public class PricingModelData
    {
        public bool Success = false;
        public dynamic Data = null;
        public dynamic ProviderInput = null;
        public dynamic CustomerInput = null;
        public PricingSummaryData SummaryTotal = new PricingSummaryData();
    }
}