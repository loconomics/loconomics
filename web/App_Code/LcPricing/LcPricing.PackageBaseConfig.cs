﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    /// <summary>
    /// TODO Rename and move to LcRest -> PricingBaseConfig/PricingBase?
    /// </summary>
    public class PackageBaseConfig
    {
        #region About Pricing Type
        public int PricingTypeID;
        public string SingularName;
        public string PluralName;
        public string SlugName;
        public string AddNewLabel;
        public string ProviderDescription;
        public LcEnum.PriceCalculationType PriceCalculation;
        /// <summary>
        /// NOT IN USE (future?): IsAddon flag is used as the simplest way to define this.
        /// It defines group names in that only one element can be selected
        /// from all that are in the group. This means that a pricing with a group
        /// will only allow select one element from that pricing type, affected too
        /// by any other pricing type that share the same group name;
        /// for pricing types that allows select several elements, the collection will
        /// be null or empty.
        /// </summary>
        public string[] SelectionGroups;
        /// <summary>
        /// NOT IN USE (future?): IsAddon flag is used as the simplest way to define this.
        /// List of selection groups used in other pricing types that will cause that
        /// elements of this type cannot be selected (because you cannot select one of
        /// this when one element of that group is selected, not because are the same
        /// group else because are incompatible and create mutual exclusion.
        /// </summary>
        public string[] SelectionExclusionGroups;
        /// <summary>
        /// For now, we preserve IsAddon additionaly to the pricing-type:addon as a way
        /// to know what packages must be showed in the 'addons' section in booking that
        /// allow multi-selecting. The 'selection*groups' fields are a concept, not uset
        /// still, for now IsAddon works for that use, more simple and enough for now.
        /// </summary>
        public bool IsAddon;
        #endregion
        #region Form Texts
        /// <summary>
        /// Informational text showed as placeholder in the textbox.
        /// Explain the field or give examples, but is not a actual value for it.
        /// </summary>
        public string NamePlaceHolder;
        /// <summary>
        /// Name used to pre-fill the text-box value the first time (package creationg)
        ///  as a recommended name, user can change it of course.
        /// </summary>
        public string SuggestedName;
        /// <summary>
        /// Name used to pre-fill the text-box value and lock it, package for that
        /// pricing type has ever this fixed name, user cannot change it.
        /// SuggestedName and NamePlaceHolder has not sense when using this.
        /// </summary>
        public string FixedName;
        public string DurationLabel;
        public string PriceLabel;
        public string PriceNote;
        public string FirstTimeClientsOnlyLabel;
        public string DescriptionPlaceHolder;
        public string PriceRateQuantityLabel;
        public string PriceRateUnitLabel;
        public string NoPriceRateLabel;
        public string NumberOfSessionsLabel;
        public string InPersonPhoneLabel;
        /// <summary>
        /// A CSS class name for the element containing the pricing details
        /// </summary>
        public string ClassName;
        #endregion
        #region Action And Validation Texts
        public string SuccessOnDelete;
        public string ErrorOnDelete;
        public string SuccessOnSave;
        public string ErrorOnSave;
        public string PriceRateIsRequiredValidationError;
        public string PriceRateUnitIsRequiredValidationError;
        #endregion
        #region Help Texts
        public string LearnMoreLabel;
        public string LearnMoreText;
        public string PriceRateLearnMoreLabel;
        public string PriceRateLearnMoreText;
        public string NoPriceRateLearnMoreLabel;
        public string NoPriceRateLearnMoreText;
        #endregion
        #region Additional configuration
        public bool RequireDuration;
        public bool IncludeServiceAttributes;
        public bool IncludeSpecialPromotion;
        #endregion
        #region List Texts
        /// <summary>
        /// SummaryFormat is the default format for summaries (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: duration
        /// {1}: sessions
        /// {2}: inperson/phone
        /// </summary>
        public string SummaryFormat;
        public string SummaryFormatMultipleSessions;
        public string SummaryFormatNoDuration;
        public string SummaryFormatMultipleSessionsNoDuration;
        public string WithoutServiceAttributesCustomerMessage;
        public string WithoutServiceAttributesProviderMessage;
        public string FirstTimeClientsOnlyListText;
        public string PriceRateQuantityListLabel;
        public string PriceRateUnitListLabel;
        public string NoPriceRateListMessage;
        #endregion
        #region Booking/PricingEstimate Texts
        /// <summary>
        /// NameAndSummaryFormat is the default format for summaries with package name (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: package name
        /// {1}: duration
        /// {2}: sessions
        /// {3}: inperson/phone
        /// </summary>
        public string NameAndSummaryFormat;
        public string NameAndSummaryFormatMultipleSessions;
        public string NameAndSummaryFormatNoDuration;
        public string NameAndSummaryFormatMultipleSessionsNoDuration;
        #endregion
        #region Modification from the base package pricing and out of common things
        public PackageMod Mod;
        #endregion
    }
}