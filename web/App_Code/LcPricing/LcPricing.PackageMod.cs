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
        void CalculateCustomerData(int customerID, PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState);
        string GetCustomerHtml(int customerID, PackageBaseData package, FeeRate fee);
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
        /// <summary>
        /// It generates and return the extra html that the read-only view of a package (in a listing for example)
        /// needs from specific data of this Mod.
        /// The @feesSet will be null when the view is showed to its Provider owner of the package.
        /// </summary>
        /// <param name="package"></param>
        /// <param name="viewedBy"></param>
        /// <returns></returns>
        string GetPackageViewHtml(PackageBaseData package, Dictionary<string, LcPricingModel.FeeRate> feesSet, bool forEmail = false);
    }
}