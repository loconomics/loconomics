using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

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
            Duration = TimeSpan.FromMinutes((double)package.ServiceDuration);
            FirstTimeClientsOnly = package.FirstTimeClientsOnly;
            NumberOfSessions = package.NumberOfSessions;
            PriceRate = package.PriceRate;
            PriceRateUnit = package.PriceRateUnit;
            IsPhone = package.IsPhone;
            LanguageID = package.LanguageID;
            CountryID = package.CountryID;
            Active = package.Active;
        }

        #region Properties
        public PackageBaseConfig PricingConfig
        {
            get
            {
                return LcPricingModel.PackageBasePricingTypeConfigs[this.PricingTypeID];
            }
        }
        #endregion

        #region Static tools
        public static PackageBaseData FromPackageID(int packageID)
        {
            var d = LcData.GetProviderPackage(packageID);
            return new PackageBaseData(d);
        }
        #endregion

        #region Database/Persisting
        #region SQL
        private const string sqlSetPackage = @"
            DECLARE @PackageID int
            SET @PackageID = @0

            IF @PackageID = 0 BEGIN
                INSERT INTO ProviderPackage (
                    PricingTypeID
                    ,ProviderUserID
                    ,PositionID
                    ,LanguageID
                    ,CountryID
                    ,ProviderPackageName
                    ,ProviderPackageDescription
                    ,ProviderPackagePrice
                    ,ProviderPackageServiceDuration
                    ,FirstTimeClientsOnly
                    ,NumberOfSessions
                    ,PriceRate
                    ,PriceRateUnit
                    ,IsPhone
                    ,CreatedDate
                    ,UpdatedDate
                    ,ModifiedBy
                    ,Active
                    ,IsAddon
                ) VALUES (
                    @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, getdate(), getdate(), 'sys', @15, @16
                )
                SET @PackageID = @@Identity
            END ELSE
                UPDATE ProviderPackage SET
                    ProviderPackageName = @6
                    ,ProviderPackageDescription = @7
                    ,ProviderPackagePrice = @8
                    ,ProviderPackageServiceDuration = @9
                    ,FirstTimeClientsOnly = @10
                    ,NumberOfSessions = @11
                    ,PriceRate = @12
                    ,PriceRateUnit = @13
                    ,IsPhone=@14
                    ,UpdatedDate = getdate()
                    ,ModifiedBy = 'sys'
                    ,Active = @15
                    ,IsAddon = @16
                WHERE ProviderPackageID = @PackageID

            -- Test Alert
            EXEC TestAlertPricingDetails @2, @3

            SELECT @PackageID As ProviderPackageID
        ";
        private const string sqlDelDetails = @"
            DELETE FROM ProviderPackageDetail
            WHERE ProviderPackageID = @0
        ";
        private const string sqlSetDetail = @"
            BEGIN TRAN
                UPDATE  ProviderPackageDetail WITH (serializable)
                SET     Active = 1,
                        UpdatedDate = getdate(),
                        ModifiedBy = 'sys'
                WHERE   ProviderPackageID = @0 AND ServiceAttributeID = @1

                IF @@rowcount = 0
                BEGIN
                    INSERT INTO ProviderPackageDetail (
                        ProviderPackageID, ServiceAttributeID, 
                        CreatedDate, UpdatedDate, 
                        ModifiedBy, Active)
                    VALUES (@0, @1, getdate(), getdate(), 'sys', 1)
                END
            COMMIT TRAN
        ";
        private const string sqlSetServiceAttribute = @"
            /* Difference of this SQL to the used in 'Services' tab is that there a specific
                categoryID is passed, here we don't know that category, we assign the first
                found (enough to show attribute in services tab as checked) in a EligibleForPackages
                category in that the attribute is */
            BEGIN TRAN
                UPDATE  userprofileserviceattributes WITH (serializable)
                SET     Active = 1,
                        UpdatedDate = getdate(),
                        ModifiedBy = 'sys'
                WHERE   UserId = @0 AND PositionID = @1
                            -- NO filter by category on update here: AND ServiceAttributeCategoryID = @--2
                            AND ServiceAttributeID = @2
                            AND LanguageID = @3 AND CountryID = @4

                IF @@rowcount = 0
                BEGIN
                    INSERT INTO userprofileserviceattributes (UserID,
                        PositionID, ServiceAttributeCategoryID, ServiceAttributeID, LanguageID, CountryID, CreateDate, UpdatedDate, 
                        ModifiedBy, Active)
                    VALUES (@0, @1, 
                        /* category select first for attribute */
                        (SELECT TOP 1 a.ServiceAttributeCategoryID FROM 
                            servicecategorypositionattribute as a
                                INNER JOIN
                            serviceattributecategory As sc
                                ON a.ServiceAttributeCategoryID = sc.ServiceAttributeCategoryID
                                AND a.LanguageID = sc.LanguageID AND a.CountryID = sc.CountryID
                            WHERE a.PositionID = @1
                            AND sc.EligibleForPackages = 1
                            AND a.Active = 1
                            AND sc.Active = 1
                            AND a.LanguageID = @3
                            AND a.CountryID = @3
                            -- THIS ATTRIBUTE IS IN!
                            AND a.ServiceAttributeID = @2),
                        @2, @3, @4, getdate(), getdate(), 'sys', 1)
                END
            COMMIT TRAN
        ";
        private const string sqlDelPackage = @"
            DELETE  ProviderPackage
            WHERE   ProviderPackageID = @0
                    AND ProviderUserID = @1
                    AND PositionID = @2

            -- Test Alert
            EXEC TestAlertPricingDetails @1, @2
        ";
        #endregion

        public void Save()
        {
            using (var db = Database.Open("sqlloco")) {
                // Save the package
                this.ID = db.QueryValue(sqlSetPackage,
                    this.ID,
                    this.PricingTypeID,
                    this.ProviderUserID,
                    this.PositionID, 
                    this.LanguageID,
                    this.CountryID,
                    this.Name,
                    this.Description,
                    this.Price,
                    this.Duration.TotalMinutes,
                    this.FirstTimeClientsOnly,
                    this.NumberOfSessions,
                    this.PriceRate,
                    this.PriceRateUnit,
                    this.IsPhone,
                    1, // Active
                    PricingConfig.IsAddon
                );
				// Use Mod to save some specific data (as variables),just after create/update the package
                if (PricingConfig.Mod != null) {
					PricingConfig.Mod.SaveProviderData(this, db);
				}
                // Save the package attributes
                if (PricingConfig.IncludeServiceAttributes) {
                    db.Execute(sqlDelDetails, this.ID);
                    foreach(var att in this.ServiceAttributes) {
                        // Add to the package
                        db.Execute(sqlSetDetail,
                            this.ID,
                            att
                        );
                        // Add to the list of 'service tab' selected attributes (on one of the categories in that the attribute is)
                        db.Execute(sqlSetServiceAttribute,
                            this.ProviderUserID,
                            this.PositionID,
                            att,
                            this.LanguageID,
                            this.CountryID
                        );
                    }
                }
            }
        }

        public void Delete()
        {
            Delete(this.ID, this.ProviderUserID, this.PositionID);
        }

        public static void Delete(int packageID, int providerUserID, int positionID)
        {
            using (var db = Database.Open("sqlloco")) {
                db.Execute(sqlDelPackage, packageID, providerUserID, positionID);
            }
        }
        #endregion
    }
}