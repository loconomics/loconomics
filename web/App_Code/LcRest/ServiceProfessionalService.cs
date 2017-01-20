using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// TODO Complete methods
    /// TODO Reimplement SQLs, db naming, remove LcData.*providerPackage* methods
    /// </summary>
    public class ServiceProfessionalService
    {
        public const int ClientVisibilityAll = 0;         // visibleToClientID == 0 => visible to all
        public const int ClientVisibilityMinClientID = 1; // visibleToClientID >= 1 => visible to client id

        #region Fields
        public int serviceProfessionalServiceID;
        public int pricingTypeID;
        public int serviceProfessionalUserID;
        public int jobTitleID;
        public int languageID;
        public int countryID;
        public string name;
        public string description;
        public decimal? price;
        public int serviceDurationMinutes = 0;
        public bool firstTimeClientsOnly = false;
        public int numberOfSessions = 1;
        public decimal? priceRate;
        public string priceRateUnit = "hour";
        public bool isPhone = false;
        public int visibleToClientID = 0;
        public DateTime createdDate;
        public DateTime updatedDate;

        /// <summary>
        /// List of service attributes IDs that are part of the service detail
        /// </summary>
        public List<int> serviceAttributes;
        #endregion

        #region Instances
        public ServiceProfessionalService() { }

        public static ServiceProfessionalService FromDB(dynamic record, IEnumerable<dynamic> attributes = null)
        {
            if (record == null) return null;

            return new ServiceProfessionalService
            {
                serviceProfessionalServiceID = record.serviceProfessionalServiceID,
                pricingTypeID = record.pricingTypeID,
                serviceProfessionalUserID = record.serviceProfessionalUserID,
                jobTitleID = record.jobTitleID,
                name = record.name,
                description = record.description,
                price = record.price,
                serviceDurationMinutes = record.serviceDurationMinutes,
                firstTimeClientsOnly = record.firstTimeClientsOnly,
                numberOfSessions = record.numberOfSessions,
                priceRate = record.priceRate,
                priceRateUnit = record.priceRateUnit,
                isPhone = record.isPhone,
                visibleToClientID = record.VisibleToClientID,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate,

                // Array of IDs of serviceAttributes
                serviceAttributes = (attributes == null ? null : attributes.Select(att =>
                {
                    return (int)att.serviceAttributeID;
                }).ToList<int>())
            };
        }

        public static ServiceProfessionalService FromDbProviderPackage(dynamic record, IEnumerable<dynamic> attributes = null)
        {
            if (record == null) return null;

            return new ServiceProfessionalService
            {
                serviceProfessionalServiceID = record.ProviderPackageID,
                pricingTypeID = record.PricingTypeID,
                serviceProfessionalUserID = record.ProviderUserID,
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
                visibleToClientID = record.VisibleToClientID,
                createdDate = record.CreatedDate,
                updatedDate = record.UpdatedDate,

                // Array of IDs of serviceAttributes
                serviceAttributes = (attributes == null ? null : attributes.Select(att =>
                {
                    return (int)att.ServiceAttributeID;
                }).ToList<int>())
            };
        }
        #endregion

        #region Fetch
        public static ServiceProfessionalService Get(int serviceProfessionalServiceID, int? serviceProfessionalUserID, int? jobTitleID = null)
        {
            var service = FromDbProviderPackage(GetProviderPackage(serviceProfessionalServiceID));
            if (service == null ||
                serviceProfessionalUserID.HasValue && service.serviceProfessionalUserID != serviceProfessionalUserID.Value ||
                jobTitleID.HasValue && service.jobTitleID != jobTitleID.Value)
            {
                // Null even if exists but does not matches the required user and jobTitle
                return null;
            }
            return service;
        }

        private void FillAttributes()
        {
            IEnumerable<dynamic> attributes = GetProviderPackageServiceAttributes(serviceProfessionalServiceID);
            // Array of IDs of serviceAttributes
            serviceAttributes = (attributes == null ? null : attributes.Select(att =>
            {
                return (int)att.ServiceAttributeID;
            }).ToList<int>());
        }

        private static IEnumerable<ServiceProfessionalService> BindDetailsToProviderPackage(ProviderPackagesView packages)
        {
            return ((IEnumerable<dynamic>)packages.Packages).Select<dynamic, ServiceProfessionalService>(pak =>
            {
                var pakID = (int)pak.ProviderPackageID;
                var hasAtts = packages.PackagesDetailsByPackage.ContainsKey(pakID);
                return FromDbProviderPackage(pak, hasAtts ? packages.PackagesDetailsByPackage[(int)pak.ProviderPackageID] : null);
            });
        }

        /// <returns>Provider's pricings bookable by the provider</returns>
        public static IEnumerable<ServiceProfessionalService> GetList(int serviceProfessionalUserID, int jobTitleID = -1)
        {
            ClientVisibility bookableByProvider = ClientVisibility.BookableByProvider();
            var packages = GetPricingPackagesByProviderPosition(serviceProfessionalUserID, jobTitleID, clientVisibility: bookableByProvider);

            return BindDetailsToProviderPackage(packages).ToList();
        }

        /// <returns>Provider's pricings specific to the client across all job titles</returns>
        public static IEnumerable<ServiceProfessionalService> GetListByClient(int serviceProfessionalUserID, int clientID)
        {
            var packages = GetPricingPackagesForClient(serviceProfessionalUserID, clientID);

            return BindDetailsToProviderPackage(packages).ToList();
        }

        /// <returns>Pricings the provider may book for the client for a given job title</returns>
        public static IEnumerable<ServiceProfessionalService> GetListBookableByClient(int serviceProfessionalUserID, int jobTitleID, int clientID)
        {
            ClientVisibility visibilityForClient = ClientVisibility.BookableByProviderForClient(clientID);
            var packages = GetPricingPackagesByProviderPosition(serviceProfessionalUserID, jobTitleID, clientVisibility: visibilityForClient);
            return BindDetailsToProviderPackage(packages).ToList();
        }

        /// <summary>
        /// Retrieve a list of services given a list of serviceIDs, all must match the given userID and belong to the same jobTitle.
        /// Used usually to prepare a PricingSummaryDetail listing, computing pricing for a booking.
        /// </summary>
        /// <param name="serviceProfessionalUserID"></param>
        /// <param name="serviceIds"></param>
        /// <returns></returns>
        public static IEnumerable<ServiceProfessionalService> GetListByIds(int serviceProfessionalUserID, IEnumerable<int> serviceIds)
        {
            int jobTitleID = 0;
            int langID = 0;
            int countryID = 0;

            using (var db = new LcDatabase())
            {
                foreach (var serviceID in serviceIds)
                {
                    var service = Get(serviceID, serviceProfessionalUserID);

                    if (service == null)
                        throw new ConstraintException("Impossible to retrieve information for the ServiceID: " + serviceID);

                    // Get and double check position
                    if (jobTitleID == 0)
                    {
                        jobTitleID = service.jobTitleID;
                        langID = service.languageID;
                        countryID = service.countryID;
                    }
                    else if (jobTitleID != service.jobTitleID ||
                        langID != service.languageID ||
                        countryID != service.countryID)
                    {
                        // All services must be part of the same position
                        throw new ConstraintException("All services must be selected from the same job title");
                    }

                    yield return service;
                }
            }
        }

        #region SQL GetFromPricingSummary
        /// <summary>
        /// Query the services data, as from the current service professional set-up,
        /// that are linked in the given pricing summary. Take care that 
        /// the pricing summary detail may have saved different values for some
        /// fields for price and duration.
        /// </summary>
        const string sqlGetFromPricingSummary = @"
            SELECT  P.serviceProfessionalServiceID
                    ,PP.ProviderUserID As serviceProfessionalUserID
                    ,PP.pricingTypeID
                    ,PP.PositionID As jobTitleID
                    ,PP.languageID
                    ,PP.countryID

                    ,PP.ProviderPackageName As name
                    ,PP.ProviderPackageDescription As description
                    ,PP.ProviderPackagePrice As price
                    ,PP.providerPackageServiceDuration As serviceDurationMinutes

                    ,PP.firstTimeClientsOnly
                    ,PP.numberOfSessions
                    ,PP.priceRate
                    ,PP.priceRateUnit
                    ,PP.isPhone

                    ,PP.createdDate
                    ,PP.updatedDate
            FROM    PricingSummaryDetail As P
                     INNER JOIN
                    ProviderPackage As PP
                      ON PP.ProviderPackageID = P.ServiceProfessionalServiceID
                     INNER JOIN
                    PricingType As PT
                        ON PP.PricingTypeID = PT.PricingTypeID
                        AND PP.LanguageID = PT.LanguageID
                        AND PP.CountryID = PT.CountryID
            WHERE   P.PricingSummaryID = @0
                     AND 
                    P.PricingSummaryRevision = @1
            ORDER BY PT.DisplayRank
        ";
        #endregion
        public static IEnumerable<ServiceProfessionalService> GetFromPricingSummary(int pricingSummaryID, int pricingSummaryRevision)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlGetFromPricingSummary, pricingSummaryID, pricingSummaryRevision)
                .Select<dynamic, ServiceProfessionalService>(pak => {
                    return FromDB(pak, null);
                });
            }
        }
        #endregion

        private class ProviderPackagesView
        {
            public dynamic Packages;
            public dynamic PackagesDetails;
            public Dictionary<int, dynamic> PackagesByID;
            public Dictionary<int, List<dynamic>> PackagesDetailsByPackage;
        }

        #region Package Type (Provider Packages)
        public static dynamic GetProviderPackage(int providerPackageID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.QuerySingle(SQLSelectFromPackage + @"
                WHERE   p.ProviderPackageID = @0
            ", providerPackageID);
            }
        }

        public static dynamic GetProviderPackageServiceAttributes(int providerPackageID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(SQLGetPackageServiceAttributesByPackageID, providerPackageID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());
            }
        }

        public const string SQLSelectFromPackage = @"
                SELECT  p.ProviderPackageID
                        ,p.PricingTypeID
                        ,p.ProviderUserID
                        ,p.PositionID
                        ,p.ProviderPackageName As Name
                        ,p.ProviderPackageDescription As Description
                        ,p.ProviderPackagePrice As Price
                        ,p.ProviderPackageServiceDuration As ServiceDuration
                        ,p.FirstTimeClientsOnly
                        ,p.NumberOfSessions
                        ,p.PriceRate
                        ,p.PriceRateUnit
                        ,p.IsPhone
                        ,p.LanguageID
                        ,p.CountryID
                        ,p.CreatedDate
                        ,p.UpdatedDate
                        ,p.Active
                        ,p.VisibleToClientID
                FROM    ProviderPackage As P
        ";

        private const string SQLGetPackageServiceAttributesByPackageID = @"
                SELECT  PD.ServiceAttributeID
                        ,A.Name
                        ,A.ServiceAttributeDescription
                        ,P.ProviderPackageID
                FROM    ProviderPackageDetail As PD
                         INNER JOIN
                        ProviderPackage As P
                          ON P.ProviderPackageID = PD.ProviderPackageID
                         INNER JOIN
                        ServiceAttribute As A
                          ON A.ServiceAttributeID = PD.ServiceAttributeID
                            AND A.LanguageID = P.LanguageID AND A.CountryID = P.CountryID
                WHERE   A.LanguageID = @1
                        AND A.CountryID = @2
                        AND PD.ProviderPackageID = @0
                ORDER BY A.Name ASC
        ";

        private const string SQLGetPackageServiceAttributesByMulti = @"
                SELECT  PD.ServiceAttributeID
                        ,A.Name
                        ,A.ServiceAttributeDescription
                        ,P.ProviderPackageID
                FROM    ProviderPackageDetail As PD
                         INNER JOIN
                        ProviderPackage As P
                          ON P.ProviderPackageID = PD.ProviderPackageID
                         INNER JOIN
                        ServiceAttribute As A
                          ON A.ServiceAttributeID = PD.ServiceAttributeID
                            AND A.LanguageID = P.LanguageID AND A.CountryID = P.CountryID
                WHERE   P.ProviderUserID = @0
                         AND (@1 = -1 OR P.PositionID = @1)
                         AND P.LanguageID = @2 AND P.CountryID = @3
                         AND PD.Active = 1 AND P.Active = 1
                         AND (@4 = -1 OR P.ProviderPackageID = @4)
                         AND (@5 = -1 OR P.PricingTypeID = @5)
                         AND (@6 = -1 OR P.IsAddOn = @6)
                ORDER BY A.Name ASC
        ";

        private static dynamic QueryPackagesByMulti(Database db, int providerUserID, int positionID = -1, int packageID = -1, int pricingTypeID = -1, bool? isAddon = null, ClientVisibility clientVisibility = null)
        {
            // By default, return pricings that are bookable by the public
            clientVisibility = clientVisibility ?? ClientVisibility.BookableByPublic();

            const string SQLGetPackagesByMulti = SQLSelectFromPackage + @"
                         INNER JOIN
                        PricingType As PT
                          ON P.PricingTypeID = PT.PricingTypeID
                            AND P.LanguageID = PT.LanguageID
                            AND P.CountryID = PT.CountryID
                         INNER JOIN
                        PositionPricingType AS PPT
                          ON PPT.PositionID = P.PositionID
                            AND PPT.PricingTypeID = PT.PricingTypeID
                            AND PPT.LanguageID = PT.LanguageID
                            AND PPT.CountryID = PT.CountryID
                            AND PPT.Active = 1
                WHERE   p.ProviderUserID = @0
                         AND (@1 = -1 OR P.PositionID = @1)
                         AND 
                        p.LanguageID = @2 AND p.CountryID = @3
                         AND 
                        p.Active = 1
                         AND (@4 = -1 OR p.ProviderPackageID = @4)
                         AND (@5 = -1 OR p.PricingTypeID = @5)
                         AND (@6 = -1 OR P.IsAddOn = @6)
                         AND P.VisibleToClientID IN ({0})
                ORDER BY PT.DisplayRank ASC
            ";

            // Database.Query does not natively expand SQL IN clause list, so do it manually :(
            string query = String.Format(SQLGetPackagesByMulti, String.Join(",", clientVisibility.VisibleToClientIDs()));

            return db.Query(query,
                providerUserID,
                positionID,
                LcData.GetCurrentLanguageID(),
                LcData.GetCurrentCountryID(),
                packageID,
                pricingTypeID,
                (isAddon.HasValue ? (isAddon.Value ? 1 : 0) : -1)
            );
        }

        private static dynamic QueryPackageServiceAttributesByMulti(Database db, int providerUserID, int positionID = -1, int packageID = -1, int pricingTypeID = -1, bool? isAddon = null)
        {
            return db.Query(SQLGetPackageServiceAttributesByMulti,
                providerUserID,
                positionID,
                LcData.GetCurrentLanguageID(),
                LcData.GetCurrentCountryID(),
                packageID,
                pricingTypeID,
                (isAddon.HasValue ? (isAddon.Value ? 1 : 0) : -1)
            );
        }

        private static ProviderPackagesView ProviderPackagesViewFromDB(dynamic packages, dynamic details)
        {
            // Create index of packages, Key:ID, Value:Package record
            var index = new Dictionary<int, dynamic>(packages.Count);
            foreach (var pak in packages)
            {
                index.Add(pak.ProviderPackageID, pak);
            }
            // Create index of packages details per package, Key:PackageID, Value:List of details records
            var detailsIndex = new Dictionary<int, List<dynamic>>();
            foreach (var det in details)
            {
                List<dynamic> detI = null;
                if (detailsIndex.ContainsKey(det.ProviderPackageID))
                    detI = detailsIndex[det.ProviderPackageID];
                else
                {
                    detI = new List<dynamic>();
                    detailsIndex.Add(det.ProviderPackageID, detI);
                }
                detI.Add(det);
            }

            return new ProviderPackagesView { Packages = packages, PackagesDetails = details, PackagesByID = index, PackagesDetailsByPackage = detailsIndex };
        }

        private static ProviderPackagesView GetPricingPackagesForClient(int providerUserID, int clientID)
        {
            dynamic packages, details;

            using (var db = Database.Open("sqlloco"))
            {
                // Get the provider packages
                packages = QueryPackagesByMulti(db, providerUserID, clientVisibility: ClientVisibility.SpecificToClient(clientID));

                details = QueryPackageServiceAttributesByMulti(db, providerUserID);
            }

            return ProviderPackagesViewFromDB(packages, details);
        }

        private static ProviderPackagesView GetPricingPackagesByProviderPosition(int providerUserID, int positionID, int packageID = -1, int pricingTypeID = -1, bool? isAddon = null, ClientVisibility clientVisibility = null)
        {
            dynamic packages, details;
            using (var db = Database.Open("sqlloco"))
            {
                // Get the Provider Packages
                packages = QueryPackagesByMulti(db, providerUserID, positionID, packageID, pricingTypeID, isAddon, clientVisibility);

                details = QueryPackageServiceAttributesByMulti(db, providerUserID, positionID, packageID, pricingTypeID, isAddon);
            }

            return ProviderPackagesViewFromDB(packages, details);
        }
        #endregion

        private class ClientVisibility
        {
            private int[] visibleToClientIDs;

            private ClientVisibility(int[] clientIDs)
            {
                visibleToClientIDs = clientIDs;
            }

            public static ClientVisibility SpecificToClient(int clientID)
            {
                return new ClientVisibility(new int[] { clientID });
            }

            public static ClientVisibility BookableByProviderForClient(int clientID)
            {
                return new ClientVisibility(new int[] { 0, clientID });
            }

            public static ClientVisibility BookableByClient(int clientID)
            {
                return BookableByProviderForClient(clientID);
            }

            public static ClientVisibility BookableByPublic()
            {
                return new ClientVisibility(new int[] { 0 });
            }

            public static ClientVisibility BookableByProvider()
            {
                return BookableByPublic();
            }

            public int[] VisibleToClientIDs()
            {
                return visibleToClientIDs;
            }
        }
    }
}
