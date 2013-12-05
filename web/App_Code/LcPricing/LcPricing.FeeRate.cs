using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class FeeRate
    {
        public decimal Percentage;
        public decimal Currency;
        public static FeeRate FromDatabaseCustomerFees(dynamic feeData)
        {
            return new FeeRate {
                Percentage = (feeData.ServiceFeePercentage ?? 0M) / 100.0M,
                Currency = feeData.ServiceFeeFixed ?? 0M
            };
        }
        public static FeeRate FromDatabaseProviderFees(dynamic feeData)
        {
            return new FeeRate {
                Percentage = (feeData.PaymentProcessingFeePercentage ?? 0M) / 100.0M,
                Currency = feeData.PaymentProcessingFeeFixed ?? 0M
            };
        }
    }
}