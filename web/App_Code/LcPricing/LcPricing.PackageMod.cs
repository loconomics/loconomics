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
    public interface PackageMod
    {
        /// <summary>
        /// It calculates the package duration and price (maybe other parameters as modelData.ProviderInput) before pass
        /// the standard calculation of total price for pricingestimate.
        /// Thats need for packages with special requirements on calculation based on additional
        /// parameters with not a package price or package duration.
        /// </summary>
        /// <param name="package"></param>
        /// <param name="ModelState"></param>
        void CalculateCustomerData(PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState);
        string GetCustomerHtml(PackageBaseData package, FeeRate fee);
        string GetProviderHtml(PackageBaseData package);
        bool ValidateProviderData(PackageBaseData package, System.Web.WebPages.Html.ModelStateDictionary modelState);
        void SaveProviderData(PackageBaseData package, Database db);
        /// <summary>
        /// It can return null or empty when there are no more details.
        /// Its used to show the pricing variables of a package, for example, or other kind
        /// of details associated with the package during a specific pricing that are specific
        /// of the Mod.
        /// </summary>
        /// <param name="package"></param>
        /// <returns></returns>
        string GetPackagePricingDetails(int packageID, int pricingEstimateID, int pricingEstimateRevision);
    }
}