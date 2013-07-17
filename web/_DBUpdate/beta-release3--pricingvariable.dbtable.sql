
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM pricingvariable 
INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('1'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'True'
   ,'bedroom'
   ,'Average time to clean a bedroom:'
   ,'Number of bedrooms:'
   ,''
   ,''
   ,'dropdown'
   ,'dropdown'
   ,'minutes'
   ,'number'
   ,'5, 10, 15, 20, 25, 30, 35, 40'
   ,'0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('2'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'hometype'
   ,''
   ,'Type of home:'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'text'
   ,''
   ,'Studio, Aparment, Condo, Home, Cabin'
   ,'4/17/2012 12:00:00 AM'
   ,'4/17/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('3'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'True'
   ,'bathroom'
   ,'Average time to clean a bathroom:'
   ,'Number of bathrooms:'
   ,''
   ,''
   ,'dropdown'
   ,'dropdown'
   ,'minutes'
   ,'number'
   ,'5, 10, 15, 20, 25, 30, 35, 40'
   ,'0, 1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('4'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'True'
   ,'livingroom'
   ,'Average time to clean a living room:'
   ,'Number of living rooms:'
   ,''
   ,''
   ,'dropdown'
   ,'dropdown'
   ,'minutes'
   ,'number'
   ,'5, 10, 15, 20, 25, 30, 35, 40'
   ,'0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('5'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'True'
   ,'stairway'
   ,'Average time to clean a stairway:'
   ,'Number of stairways:'
   ,''
   ,''
   ,'dropdown'
   ,'dropdown'
   ,'minutes'
   ,'number'
   ,'5, 10, 15, 20, 25, 30, 35, 40'
   ,'0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('6'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'squarefeet'
   ,''
   ,'Cleaning area size:'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'square feet'
   ,''
   ,'0-500 square feet,501-999 square feet,1000-1500 square feet,1501-2000 square feet,2001-2500 square feet,2501-3000 square feet,3001-3500 square feet,3501-4000 square feet,4001-4500 square feet,4501-5000 square feet, Over 5000 square feet'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('7'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'thoroughness'
   ,''
   ,'Thoroughness'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'cleanliness'
   ,''
   ,'Light (you clean regularly on your own), Normal (you aren''t very messy), Deep (you need some serious help), Move-in, Move-out'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'True')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('8'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'frequency'
   ,''
   ,'Frequency:'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'frequency'
   ,''
   ,'One-time only,Weekly, Twice weekly, Every two weeks, Every three weeks, Every four weeks, Every five weeks, Every six weeks'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('9'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'pets'
   ,''
   ,'Number of pets (who shed hair):'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'number'
   ,''
   ,'0,1,2,3,4,5'
   ,'4/18/2012 12:00:00 AM'
   ,'4/18/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('10'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'floortype'
   ,''
   ,'Floor type(s):'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'text'
   ,''
   ,'Hardwood floors,Carpeted floors, Tile floors, Multiple surfaces'
   ,'4/19/2012 12:00:00 AM'
   ,'4/19/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'2'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('11'
   ,'32'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'hours'
   ,''
   ,'Hours:'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'number'
   ,''
   ,'0.5,1,1.5,2,2.5,3,3.5,4'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('12'
   ,'106'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'hours'
   ,''
   ,'Hours:'
   ,''
   ,''
   ,''
   ,'dropdown'
   ,''
   ,'number'
   ,''
   ,'0.5,0.75,1.0,1.23,1.5,2.0'
   ,'6/21/2012 12:00:00 AM'
   ,'6/21/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('13'
   ,'186'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'hours'
   ,''
   ,'Hours:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'7/12/2012 12:00:00 AM'
   ,'7/12/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('14'
   ,'61'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'True'
   ,'hours'
   ,''
   ,'Hours:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'8/23/2012 12:00:00 AM'
   ,'8/23/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('15'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'lightcleaningspeed'
   ,'Average time to light clean a  2 bedroom/2 bathroom home: '
   ,''
   ,'We ask this to help determine an accurate price and time estimate for customers. We understand this can vary, but give us your best guess.'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'9'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('16'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'routinecleaningspeed'
   ,'Average time to routine clean a  2 bedroom/2 bathroom home: '
   ,''
   ,'We ask this to help determine an accurate price and time estimate for customers. We understand this can vary, but give us your best guess.'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'10'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('17'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'deepcleaningspeed'
   ,'Average time to deep clean a  2 bedroom/2 bathroom home: '
   ,''
   ,'We ask this to help determine an accurate price and time estimate for customers. We understand this can vary, but give us your best guess.'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/5/2013 12:00:00 AM'
   ,'5/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'11'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('18'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'lightcleaninghourlyrate'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'9'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('19'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'routinecleaninghourlyrate'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'10'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('20'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'True'
   ,'False'
   ,'deepcleaninghourlyrate'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'11'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('21'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bedrooms'
   ,''
   ,'Number of bedrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'9'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('22'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bedrooms'
   ,''
   ,'Number of bedrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'10'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('23'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bedrooms'
   ,''
   ,'Number of bedrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'11'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('24'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bathrooms'
   ,''
   ,'Number of bathrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'9'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('25'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bathrooms'
   ,''
   ,'Number of bathrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'10'
   ,'False')

INSERT INTO [pricingvariable]
   ([PricingVariableID]
   ,[PositionID]
   ,[ClientTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[ProviderInputDataRequired]
   ,[CustomerInputDataRequired]
   ,[PricingVariableName]
   ,[ProviderPricingVariableDisplayText]
   ,[CustomerPricingVariableDisplayText]
   ,[ProviderPricingVariableDescription]
   ,[CustomerPricingVariableDescription]
   ,[ProviderDataInputType]
   ,[CustomerDataInputType]
   ,[ProviderDataInputUnit]
   ,[CustomerDataInputUnit]
   ,[ProviderDataValues]
   ,[CustomerDataValues]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[PricingTypeID]
   ,[PricingSurchargeVariable])
VALUES
   ('26'
   ,'14'
   ,'1'
   ,'1'
   ,'1'
   ,'False'
   ,'True'
   ,'bathrooms'
   ,''
   ,'Number of bathrooms:'
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,''
   ,'5/11/2013 12:00:00 AM'
   ,'5/11/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'11'
   ,'False')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
