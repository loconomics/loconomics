using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// TODO Continue refactor, getting here the info fetch at LcData
/// </summary>
public class LcRestServiceProfessionalServices
{
    public LcRestServiceProfessionalServices() { }
    public int freelancerPricingID;
    public int pricingTypeID;
    public int freelancerUserID;
    public int jobTitleID;
    public string name;
    public string description;
    public decimal? price;
    /// <summary>
    /// In minutes
    /// </summary>
    public int serviceDurationMinutes = 0;
    public bool firstTimeClientsOnly = false;
    public int numberOfSessions = 1;
    public decimal? priceRate;
    public string priceRateUnit = "hour";
    public bool isPhone = false;
    public DateTime createdDate;
    public DateTime updatedDate;

    /// <summary>
    /// List of service attributes IDs that are part of the pricing detail
    /// </summary>
    public List<int> serviceAttributes;

    public static LcRestServiceProfessionalServices FromDatabase(dynamic record, IEnumerable<dynamic> attributes)
    {
        if (record == null) return null;

        return new LcRestServiceProfessionalServices
        {
            freelancerPricingID = record.ProviderPackageID,
            pricingTypeID = record.PricingTypeID,
            freelancerUserID = record.ProviderUserID,
            jobTitleID = record.PositionID,
            name = record.Name,
            description = record.Description,
            price = record.Price,
            serviceDurationMinutes = record.ServiceDuration,
            firstTimeClientsOnly = record.FirstTimeClientsOnly,
            numberOfSessions = record.NumberOfSessions,
            priceRate = record.PriceRate,
            priceRateUnit = record.PriceRateUnit,
            isPhone = record.IsPhone,
            createdDate = record.CreatedDate,
            updatedDate = record.UpdatedDate,
                
            // Array of IDs of serviceAttributes
            serviceAttributes = (attributes == null ? null : attributes.Select(att => {
                return (int)att.ServiceAttributeID;
            }).ToList<int>())
        };
    }

    public static LcRestServiceProfessionalServices Get(int serviceProfessionalServiceID)
    {
        return LcRestServiceProfessionalServices.FromDatabase(LcData.GetProviderPackage(serviceProfessionalServiceID), LcData.GetProviderPackageServiceAttributes(serviceProfessionalServiceID));
    }

    public static IEnumerable<LcRestServiceProfessionalServices> GetList(int serviceProfessionalUserID, int jobTitleID = -1)
    {
        var packages = LcData.GetPricingPackagesByProviderPosition(serviceProfessionalUserID, jobTitleID);

        return ((IEnumerable<dynamic>)packages.Packages).Select<dynamic, LcRestServiceProfessionalServices>(pak =>
        {
            var pakID = (int)pak.ProviderPackageID;
            var hasAtts = packages.PackagesDetailsByPackage.ContainsKey(pakID);
            return LcRestServiceProfessionalServices.FromDatabase(pak, hasAtts ? packages.PackagesDetailsByPackage[(int)pak.ProviderPackageID] : null);
        }).ToList();
    }
}