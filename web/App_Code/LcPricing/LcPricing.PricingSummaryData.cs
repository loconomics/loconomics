using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class PricingSummaryData
    {
        public decimal SubtotalPrice = 0M;
        public decimal FeePrice = 0M;
        public decimal TotalPrice = 0M;
        public decimal PFeePrice = 0M;
        /// <summary>
        /// Duration in Hours
        /// </summary>
        public decimal ServiceDuration = 0M;
        public decimal FirstSessionDuration = 0M;
        public string Concept = "";
        public PricingSummaryData()
        {
        }
        public PricingSummaryData(string concept)
        {
            this.Concept = concept;
        }
        public PricingSummaryData(decimal subtotalPrice, decimal feePrice, decimal totalPrice, decimal serviceDuration, decimal firstSessionDuration, decimal pFeePrice = 0)
        {
            this.SubtotalPrice = subtotalPrice;
            this.FeePrice = feePrice;
            this.TotalPrice = totalPrice;
            this.PFeePrice = pFeePrice;
            this.ServiceDuration = serviceDuration;
            this.FirstSessionDuration = firstSessionDuration;
        }
        public static PricingSummaryData operator + (PricingSummaryData one, PricingSummaryData add)
        {
            return new PricingSummaryData(
                one.SubtotalPrice + add.SubtotalPrice,
                one.FeePrice + add.FeePrice,
                one.TotalPrice + add.TotalPrice,
                one.ServiceDuration + add.ServiceDuration,
                one.FirstSessionDuration + add.FirstSessionDuration,
                one.PFeePrice + add.PFeePrice
            );
        }
        public void Add(PricingSummaryData add)
        {
            this.ServiceDuration += add.ServiceDuration;
            this.FirstSessionDuration += add.FirstSessionDuration;
            this.SubtotalPrice += add.SubtotalPrice;
            this.FeePrice += add.FeePrice;
            this.TotalPrice += add.TotalPrice;
            this.PFeePrice += add.PFeePrice;
            if (!String.IsNullOrEmpty(add.Concept))
                this.Concept = add.Concept;
        }
    }
}