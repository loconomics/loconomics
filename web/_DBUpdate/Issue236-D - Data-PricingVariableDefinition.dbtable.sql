
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM PricingVariableDefinition 
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'-1'
   ,'1'
   ,'HourlyRate'
   ,'True'
   ,'False'
   ,'decimal'
   ,'Hourly Rate'
   ,'Please enter your hourly rate for these services'
   ,'hour'
   ,'hours'
   ,'NULL '
   ,'NULL '
   ,NULL
   ,'6/26/2013 5:12:52 PM'
   ,'6/26/2013 5:12:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'-1'
   ,'1'
   ,'Hours'
   ,'False'
   ,'True'
   ,'decimal'
   ,'Hours'
   ,'Please select the number of hours'
   ,'hour'
   ,'hours'
   ,'NULL '
   ,'NULL '
   ,'1'
   ,'6/26/2013 5:12:52 PM'
   ,'6/26/2013 5:12:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'16'
   ,'1'
   ,'ChildSurcharge'
   ,'True'
   ,'False'
   ,'decimal'
   ,'Additional child'
   ,'Please indicate how many children your hourly rate includes and the hourly surcharge, if any, per additional child.'
   ,'child'
   ,'children'
   ,'NULL '
   ,'NULL '
   ,NULL
   ,'6/26/2013 5:12:52 PM'
   ,'6/26/2013 5:12:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'16'
   ,'1'
   ,'NumberOfChildren'
   ,'False'
   ,'True'
   ,'int'
   ,'Number of Children'
   ,'Please indicate how many children you''d like babysat'
   ,'child'
   ,'children'
   ,'NULL '
   ,'NULL '
   ,'3'
   ,'6/26/2013 5:12:52 PM'
   ,'6/26/2013 5:12:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'-1'
   ,'9'
   ,'CleaningRate'
   ,'True'
   ,'False'
   ,'decimal'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:22:08 PM'
   ,'6/26/2013 5:22:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'-1'
   ,'10'
   ,'CleaningRate'
   ,'True'
   ,'False'
   ,'decimal'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:22:08 PM'
   ,'6/26/2013 5:22:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'-1'
   ,'11'
   ,'CleaningRate'
   ,'True'
   ,'False'
   ,'decimal'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:22:08 PM'
   ,'6/26/2013 5:22:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'-1'
   ,'9'
   ,'BedsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bedrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:23 PM'
   ,'6/26/2013 5:30:23 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'-1'
   ,'10'
   ,'BedsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bedrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:23 PM'
   ,'6/26/2013 5:30:23 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'-1'
   ,'11'
   ,'BedsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bedrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:23 PM'
   ,'6/26/2013 5:30:23 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'-1'
   ,'9'
   ,'BathsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bathrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:44 PM'
   ,'6/26/2013 5:30:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'-1'
   ,'10'
   ,'BathsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bathrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:44 PM'
   ,'6/26/2013 5:30:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableDefinition]
   ([PricingVariableID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionID]
   ,[PricingTypeID]
   ,[InternalName]
   ,[IsProviderVariable]
   ,[IsCustomerVariable]
   ,[DataType]
   ,[VariableLabel]
   ,[VariableLabelPopUp]
   ,[VariableNameSingular]
   ,[VariableNamePlural]
   ,[NumberIncludedLabel]
   ,[NumberIncludedLabelPopup]
   ,[CalculateWithVariableID]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'-1'
   ,'11'
   ,'BathsNumber'
   ,'False'
   ,'True'
   ,'int'
   ,'Bathrooms'
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 5:30:44 PM'
   ,'6/26/2013 5:30:44 PM'
   ,'sys'
   ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
