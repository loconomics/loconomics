using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    [Obsolete("Rules applied here, from decissions at Barcelona 2013 weekend, were superseed by decisions with Josh on 2015/09, applied at new internal API LcRest.PricingSummary")]
    public class Price
    {
        int roundedDecimals;
        decimal feeRate;
        decimal fixedFeeAmount;
        decimal basePrice;
        decimal totalPrice;
        decimal feePrice;
        /// <summary>
        /// Giving a base price (no fees) the fees rate (from 0 to 1) and 
        /// number of decimal to round up, it calculates the total price
        /// (price with fees) and the fee amount.
        /// Rounding is done on the Total Price, and fee amount updated
        /// to match the rounded price and base price.
        /// </summary>
        /// <param name="basePrice">No fees price</param>
        /// <param name="feeRate">Number between 0 and 1. Its percentage / 100.</param>
        /// <param name="roundedDecimals">Number of decimals to round up from the final price (TotalPrice)</param>
        public Price(decimal basePrice, decimal feeRate, int roundedDecimals)
        {
            this.basePrice = Math.Round(basePrice, 2);
            this.feeRate = feeRate;
            this.fixedFeeAmount = 0M;
            this.roundedDecimals = roundedDecimals;
            Calculate();
        }
        public Price(decimal basePrice, FeeRate fee, int roundedDecimals)
        {
            this.basePrice = Math.Round(basePrice, 2);
            this.feeRate = fee.Percentage;
            this.fixedFeeAmount = fee.Currency;
            this.roundedDecimals = roundedDecimals;
            Calculate();
        }
        private void Calculate()
        {
            totalPrice = basePrice * (1 + feeRate) + fixedFeeAmount;
            // Rounding up, ever (with ceiling but preserving decimals
            var tens = (decimal)Math.Pow(10, roundedDecimals);
            totalPrice = Math.Ceiling( totalPrice * tens ) / tens;
            feePrice = totalPrice - basePrice;
        }
        public decimal BasePrice
        {
            get
            {
                return this.basePrice;
            }
            set
            {
                this.basePrice = value;
                Calculate();
            }
        }
        public decimal FeeRate
        {
            get
            {
                return this.feeRate;
            }
            set
            {
                this.feeRate = value;
                Calculate();
            }
        }
        public decimal FixedFeeAmount
        {
            get
            {
                return this.fixedFeeAmount;
            }
            set
            {
                this.fixedFeeAmount = value;
                Calculate();
            }
        }
        public decimal TotalPrice
        {
            get
            {
                return this.totalPrice;
            }
        }
        public decimal FeePrice
        {
            get
            {
                return this.feePrice;
            }
        }
    }
}