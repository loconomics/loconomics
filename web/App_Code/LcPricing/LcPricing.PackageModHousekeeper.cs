using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;
using System.Web.WebPages;
using System.Web.Helpers;
using System.Text;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class PackageModHousekeeper : PackageMod
    {
        double formulaA, formulaB, formulaC;
        string type;
        int sliderStep = 20;
        public PackageModHousekeeper(string type)
        {
            this.type = type;
            switch (type)
            {
                case "light":
                    formulaA = 20.4;
                    formulaB = 30.6;
                    formulaC = 68.34;
                    break;
                case "routine":
                    formulaA = 24;
                    formulaB = 36;
                    formulaC = 80.4;
                    break;
                case "deep":
                    formulaA = 48;
                    formulaB = 72;
                    formulaC = 160.8;
                    break;
            }
        }
        /// <summary>
        /// Calculate and returns the time in minutes for the given values
        /// </summary>
        /// <param name="numbedrooms"></param>
        /// <param name="numbathrooms"></param>
        /// <returns></returns>
        private double ApplyFormula(int numbedrooms = 2, int numbathrooms = 2)
        {
            return (formulaA * numbedrooms + formulaB * numbathrooms + formulaC);
        }
        #region Customer form part
        public void CalculateCustomerData(PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
        {
            /* IMPORTANT: we calculate here the service duration for one session based on some custom variables for housekeeper pricing,
             * final price and fees are calculated in the standard code using the package Duration field, because of that
             * we only update package.Duration here for later complete price calculation */

            // Get customer input
            var nbeds = Request["bedrooms-number"].AsInt();
            var nbaths = Request["bathrooms-number"].AsInt();
            // TODO get provider input
            var providerRate = .8; // 140.34 / formulaAverageT;
            // Apply formula, changed by the providerRate (variation from the average)
            var duration = ApplyFormula(nbeds, nbaths) * providerRate;
            // Create time object from duration, rounded to quarter-hours (15 minutes blocks)
            var timeDuration = ASP.LcHelpers.RoundTimeToQuarterHour(TimeSpan.FromMinutes(duration), ASP.LcHelpers.RoundingType.Up);
            // Change package with the information:
            package.Duration = timeDuration;
            modelData.ProviderInput = providerRate;
            modelData.CustomerInput = new { BedroomsNumber = nbeds, BathroomsNumber = nbaths };
        }
        public string GetCustomerHtml(PackageBaseData package, FeeRate fee)
        {
            // TODO get provider input
            var providerRate = .8; // 140.34 / formulaAverageT;
            // Get HourlyRate for client-side calculation, and fees
            var price = new Price(package.PriceRate ?? 0M, fee, 1);
            var hourlyFee = price.FeePrice;
            var hourlyRate = price.TotalPrice;

            var s = new StringBuilder();

            s.AppendFormat("<div class='housekeeper-pricing' data-formula-a='{0}' data-formula-b='{1}' data-formula-c='{2}' data-hourly-rate='{3}' data-hourly-fee='{4}' data-provider-rate='{5}'>", formulaA, formulaB, formulaC, hourlyRate, hourlyFee, providerRate);
            s.Append(@"<div>Help us determine an accurate 
                <span class='has-tooltip' title='LJDI: This is an estimate, you will need review it with the provider.'>
                price estimate</span></div>");

            s.Append(@"<div data-slider-value='3' data-slider-step='1' class='housekeeper-pricing-bedrooms customer-slider'><label>Bedrooms: <input name='bedrooms-number' type='text' /></label></div>");
            s.Append(@"<div data-slider-value='3' data-slider-step='1' class='housekeeper-pricing-bathrooms customer-slider'><label>Bathrooms: <input name='bathrooms-number' type='text' /></label></div>");
            s.Append("</div>");

            return s.ToString();
        }
        #endregion
        #region Provider form part
        public string GetProviderHtml(PackageBaseData package)
        {
            var s = new StringBuilder();

            // TODO Get saved value for provider average-ratio
            var ratio = 0.76517553129036045555946929670072;
            // Calculate time for the ratio
            var time = ratio * ApplyFormula();

            s.AppendFormat("<div class='housekeeper-pricing' data-slider-value='{0}' data-slider-step='{1}'>", ApplyFormula(), sliderStep);
            s.AppendFormat("<div class='label'>Average time to {0} clean a 2 bedroom/2 bathroom home: <span class='note has-tooltip' title='LJDI: To create an estimate pricing for your customers.'>Why are we asking this?</span></div>", type);
            s.AppendFormat(@"<div class='input'><input name='provider-average-time' type='text' value='{0}' />
                    <div class='provider-average-time'>
			            <div class='provider-average-time-slider'></div>
			            <label class='below-average-label'>Below average</label>
			            <label class='average-label'>Average</label>
			            <label class='above-average-label'>Above average</label>
		            </div>
                </div>", time);
            s.Append("<div class='preview'><span class='time'></span> (approximately)</div>");
            s.Append("</div>");

            return s.ToString();
        }
        public bool ValidateProviderData(PackageBaseData package, System.Web.WebPages.Html.ModelStateDictionary modelState)
        {
            // TODO
            return true;
        }
        public void SaveProviderData(PackageBaseData package, Database db)
        {
            var provTime = Request["provider-average-time"].AsInt();
            var provRate = provTime / ApplyFormula();
            // TODO Save rate on DB
        }
        #endregion
    }
}