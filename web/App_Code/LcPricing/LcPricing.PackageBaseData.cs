using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class PackageBaseData
    {
        public int ID;
        public int PricingTypeID;
        public int ProviderUserID;
        public int PositionID;
        public string Name;
        public string Description;
        public decimal Price;
        public TimeSpan Duration;
        public bool FirstTimeClientsOnly;
        public int NumberOfSessions;
        public decimal? PriceRate;
        public string PriceRateUnit;
        /// <summary>
        /// Hourly Surcharge is a field that doesn't exist on database but is used
        /// for calculation of additional price for the package, being multiply
        /// by the final package duration and added to the package price.
        /// Its used on PriceCalculationType.HourlyPrice and Mods like hourly-pricing.
        /// </summary>
        public decimal HourlySurcharge;
        public bool IsPhone;
        public int LanguageID;
        public int CountryID;
        public bool Active;
        public List<int> ServiceAttributes = new List<int>();
        public PackageBaseData()
        {
        }
        /// <summary>
        /// Create a package object using a database
        /// dynamic record
        /// </summary>
        /// <param name="package"></param>
        public PackageBaseData(dynamic package)
        {
            ID = package.ProviderPackageID;
            PricingTypeID = package.PricingTypeID;
            ProviderUserID = package.ProviderUserID;
            PositionID = package.PositionID;
            Name = package.Name;
            Description = package.Description;
            Price = package.Price;
            Duration = TimeSpan.FromMinutes(package.ServiceDuration);
            FirstTimeClientsOnly = package.FirstTimeClientsOnly;
            NumberOfSessions = package.NumberOfSessions;
            PriceRate = package.PriceRate;
            PriceRateUnit = package.PriceRateUnit;
            IsPhone = package.IsPhone;
            LanguageID = package.LanguageID;
            CountryID = package.CountryID;
            Active = package.Active;
        }
        public static PackageBaseData FromPackageID(int packageID)
        {
            var d = LcData.GetProviderPackage(packageID);
            return new PackageBaseData(d);
        }
    }
}