
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM PricingVariableValue 
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'0'
   ,'141'
   ,'0'
   ,'0'
   ,'15'
   ,'0.00'
   ,'1.00'
   ,'6.00'
   ,'8/13/2013 12:18:28 PM'
   ,'8/28/2013 12:04:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'0'
   ,'277'
   ,'0'
   ,'0'
   ,'60'
   ,'0.00'
   ,'1.50'
   ,'6.00'
   ,'8/23/2013 12:52:11 PM'
   ,'8/23/2013 12:52:11 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'0'
   ,'348'
   ,'0'
   ,'0'
   ,'14.00'
   ,'0.00'
   ,'1.00'
   ,'5.00'
   ,'8/21/2013 8:59:30 PM'
   ,'8/21/2013 8:59:30 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'72'
   ,'355'
   ,'0'
   ,'0'
   ,'35'
   ,'0.00'
   ,'4.00'
   ,'12.00'
   ,'8/12/2013 4:34:51 PM'
   ,'8/12/2013 4:34:51 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'73'
   ,'355'
   ,'0'
   ,'0'
   ,'35'
   ,'0.00'
   ,'4.00'
   ,'12.00'
   ,'8/12/2013 4:34:51 PM'
   ,'8/12/2013 4:34:51 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'0'
   ,'0'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 12:21:39 PM'
   ,'8/21/2013 3:55:57 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'419'
   ,'1'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 12:49:05 PM'
   ,'8/13/2013 12:49:05 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'420'
   ,'1'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 12:59:02 PM'
   ,'8/13/2013 12:59:02 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'421'
   ,'1'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 12:59:26 PM'
   ,'8/13/2013 12:59:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'422'
   ,'1'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 12:59:52 PM'
   ,'8/13/2013 12:59:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'74'
   ,'141'
   ,'423'
   ,'1'
   ,'20'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/13/2013 1:01:00 PM'
   ,'8/13/2013 1:01:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'79'
   ,'348'
   ,'0'
   ,'0'
   ,'14.00'
   ,'0.00'
   ,'1.00'
   ,'8.00'
   ,'8/21/2013 9:15:53 PM'
   ,'8/28/2013 5:33:17 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'81'
   ,'141'
   ,'0'
   ,'0'
   ,'16'
   ,'0.00'
   ,'1.50'
   ,'8.00'
   ,'8/28/2013 12:06:41 PM'
   ,'8/28/2013 1:00:53 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'74'
   ,'141'
   ,'423'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'8/13/2013 1:01:00 PM'
   ,'8/13/2013 1:01:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'0'
   ,'141'
   ,'0'
   ,'0'
   ,'10'
   ,'2.00'
   ,'0.00'
   ,'6.00'
   ,'8/13/2013 12:18:28 PM'
   ,'8/28/2013 12:04:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'0'
   ,'277'
   ,'0'
   ,'0'
   ,'4'
   ,'5.00'
   ,'0.00'
   ,'8.00'
   ,'8/23/2013 12:52:11 PM'
   ,'8/23/2013 12:52:11 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'0'
   ,'348'
   ,'0'
   ,'0'
   ,'4.00'
   ,'2.00'
   ,'0.00'
   ,'5.00'
   ,'8/21/2013 8:59:30 PM'
   ,'8/21/2013 8:59:30 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'72'
   ,'355'
   ,'0'
   ,'0'
   ,'5'
   ,'2.00'
   ,'0.00'
   ,'4.00'
   ,'8/12/2013 4:34:51 PM'
   ,'8/12/2013 4:34:51 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'73'
   ,'355'
   ,'0'
   ,'0'
   ,'5'
   ,'2.00'
   ,'0.00'
   ,'4.00'
   ,'8/12/2013 4:34:51 PM'
   ,'8/12/2013 4:34:51 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'74'
   ,'141'
   ,'0'
   ,'0'
   ,'12'
   ,'2.00'
   ,'0.00'
   ,'4.00'
   ,'8/13/2013 12:21:39 PM'
   ,'8/21/2013 3:55:57 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'74'
   ,'141'
   ,'423'
   ,'1'
   ,'12'
   ,'1.00'
   ,'0.00'
   ,'4.00'
   ,'8/13/2013 1:01:00 PM'
   ,'8/13/2013 1:01:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'79'
   ,'348'
   ,'0'
   ,'0'
   ,'4'
   ,'3.00'
   ,'0.00'
   ,'7.00'
   ,'8/21/2013 9:15:53 PM'
   ,'8/28/2013 5:33:17 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'81'
   ,'141'
   ,'0'
   ,'0'
   ,'10'
   ,'2.00'
   ,'0.00'
   ,'8.00'
   ,'8/28/2013 12:06:41 PM'
   ,'8/28/2013 1:00:53 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'74'
   ,'141'
   ,'423'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'8/13/2013 1:01:00 PM'
   ,'8/13/2013 1:01:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'0'
   ,'356'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'8/15/2013 1:44:00 PM'
   ,'8/15/2013 2:41:55 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'141'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:05:44 AM'
   ,'7/24/2013 4:27:41 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'141'
   ,'382'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:06:20 AM'
   ,'6/26/2013 9:06:20 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'299'
   ,'383'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:08:55 AM'
   ,'6/26/2013 9:08:55 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'299'
   ,'384'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 11:28:39 AM'
   ,'6/26/2013 11:28:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'299'
   ,'413'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 8:51:49 AM'
   ,'7/17/2013 8:51:49 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'299'
   ,'414'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:49:39 AM'
   ,'7/17/2013 9:49:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'319'
   ,'385'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 6:13:13 PM'
   ,'6/26/2013 6:13:13 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'334'
   ,'388'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:20:44 PM'
   ,'7/6/2013 3:20:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'334'
   ,'389'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:23:19 PM'
   ,'7/6/2013 3:23:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'344'
   ,'396'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 1:59:53 PM'
   ,'7/11/2013 1:59:53 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'55'
   ,'354'
   ,'416'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:17:33 PM'
   ,'7/17/2013 1:17:33 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'325'
   ,'0'
   ,'0'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 4:20:32 AM'
   ,'7/6/2013 4:20:32 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'334'
   ,'386'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:11:10 PM'
   ,'7/6/2013 3:11:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'334'
   ,'387'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:16:52 PM'
   ,'7/6/2013 3:16:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'334'
   ,'390'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:25:49 PM'
   ,'7/6/2013 3:25:49 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'335'
   ,'391'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 12:45:16 PM'
   ,'7/9/2013 12:45:16 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'337'
   ,'393'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:07:59 PM'
   ,'7/9/2013 3:07:59 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'337'
   ,'394'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:16:43 PM'
   ,'7/9/2013 3:16:43 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'338'
   ,'392'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 2:31:26 PM'
   ,'7/9/2013 2:31:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'56'
   ,'338'
   ,'395'
   ,'1'
   ,'0.647763'
   ,NULL
   ,NULL
   ,NULL
   ,'7/10/2013 11:10:41 AM'
   ,'7/10/2013 11:10:41 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'58'
   ,'287'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/8/2013 6:10:42 PM'
   ,'7/8/2013 6:10:42 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'60'
   ,'344'
   ,'397'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:36:50 PM'
   ,'7/11/2013 3:36:50 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'60'
   ,'344'
   ,'398'
   ,'1'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:38:35 PM'
   ,'7/11/2013 3:38:35 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'60'
   ,'346'
   ,'0'
   ,'0'
   ,'1.11741'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 2:52:38 PM'
   ,'7/11/2013 2:52:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'61'
   ,'346'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 2:53:19 PM'
   ,'7/11/2013 2:53:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'62'
   ,'346'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 2:53:48 PM'
   ,'7/11/2013 2:53:48 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'141'
   ,'405'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:26:51 AM'
   ,'7/15/2013 11:26:51 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'141'
   ,'406'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:27:42 AM'
   ,'7/15/2013 11:27:42 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'141'
   ,'407'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:00:10 PM'
   ,'7/15/2013 12:00:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'141'
   ,'408'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:09:00 PM'
   ,'7/15/2013 12:09:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'141'
   ,'409'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:14:37 PM'
   ,'7/15/2013 12:14:37 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'347'
   ,'400'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:47:19 PM'
   ,'7/13/2013 5:47:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'347'
   ,'401'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:50:39 PM'
   ,'7/13/2013 5:50:39 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'347'
   ,'402'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:52:26 PM'
   ,'7/13/2013 5:52:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'347'
   ,'403'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:54:10 PM'
   ,'7/13/2013 5:54:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'347'
   ,'410'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:46:40 PM'
   ,'7/15/2013 12:46:40 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'349'
   ,'0'
   ,'0'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 2:32:47 PM'
   ,'7/13/2013 2:32:47 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'63'
   ,'354'
   ,'417'
   ,'1'
   ,'1.35224'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:19:38 PM'
   ,'7/17/2013 1:19:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'64'
   ,'349'
   ,'0'
   ,'0'
   ,'0.700599'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 2:40:09 PM'
   ,'7/13/2013 2:40:09 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'64'
   ,'353'
   ,'411'
   ,'1'
   ,'0.700599'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:01:17 PM'
   ,'7/16/2013 10:01:17 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'65'
   ,'349'
   ,'0'
   ,'0'
   ,'1.0998'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 2:41:57 PM'
   ,'7/13/2013 2:41:57 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'65'
   ,'349'
   ,'399'
   ,'1'
   ,'1.0998'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 4:18:44 PM'
   ,'7/13/2013 4:18:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'68'
   ,'349'
   ,'0'
   ,'0'
   ,'1.0998'
   ,NULL
   ,NULL
   ,NULL
   ,'7/14/2013 4:46:08 PM'
   ,'7/14/2013 4:46:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'69'
   ,'347'
   ,'0'
   ,'0'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 8:32:50 AM'
   ,'7/16/2013 8:32:50 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'69'
   ,'349'
   ,'415'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:54:35 AM'
   ,'7/17/2013 9:54:35 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'69'
   ,'353'
   ,'412'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:27:08 PM'
   ,'7/16/2013 10:27:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'141'
   ,'382'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:06:20 AM'
   ,'6/26/2013 9:06:20 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'299'
   ,'383'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:08:55 AM'
   ,'6/26/2013 9:08:55 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'299'
   ,'384'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 11:28:39 AM'
   ,'6/26/2013 11:28:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'299'
   ,'413'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 8:51:49 AM'
   ,'7/17/2013 8:51:49 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'299'
   ,'414'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:49:39 AM'
   ,'7/17/2013 9:49:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'319'
   ,'385'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 6:13:13 PM'
   ,'6/26/2013 6:13:13 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'334'
   ,'388'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:20:44 PM'
   ,'7/6/2013 3:20:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'334'
   ,'389'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:23:19 PM'
   ,'7/6/2013 3:23:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'344'
   ,'396'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 1:59:53 PM'
   ,'7/11/2013 1:59:53 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'55'
   ,'354'
   ,'416'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:17:33 PM'
   ,'7/17/2013 1:17:33 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'334'
   ,'386'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:11:10 PM'
   ,'7/6/2013 3:11:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'334'
   ,'387'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:16:52 PM'
   ,'7/6/2013 3:16:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'334'
   ,'390'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:25:49 PM'
   ,'7/6/2013 3:25:49 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'335'
   ,'391'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 12:45:16 PM'
   ,'7/9/2013 12:45:16 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'337'
   ,'393'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:07:59 PM'
   ,'7/9/2013 3:07:59 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'337'
   ,'394'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:16:43 PM'
   ,'7/9/2013 3:16:43 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'338'
   ,'392'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 2:31:26 PM'
   ,'7/9/2013 2:31:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'56'
   ,'338'
   ,'395'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/10/2013 11:10:41 AM'
   ,'7/10/2013 11:10:41 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'60'
   ,'344'
   ,'397'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:36:50 PM'
   ,'7/11/2013 3:36:50 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'60'
   ,'344'
   ,'398'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:38:35 PM'
   ,'7/11/2013 3:38:35 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'141'
   ,'405'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:26:51 AM'
   ,'7/15/2013 11:26:51 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'141'
   ,'406'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:27:42 AM'
   ,'7/15/2013 11:27:42 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'141'
   ,'407'
   ,'1'
   ,'6'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:00:10 PM'
   ,'7/15/2013 12:00:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'141'
   ,'408'
   ,'1'
   ,'4'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:09:00 PM'
   ,'7/15/2013 12:09:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'141'
   ,'409'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:14:37 PM'
   ,'7/15/2013 12:14:37 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'347'
   ,'400'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:47:19 PM'
   ,'7/13/2013 5:47:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'347'
   ,'401'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:50:39 PM'
   ,'7/13/2013 5:50:39 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'347'
   ,'402'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:52:26 PM'
   ,'7/13/2013 5:52:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'347'
   ,'403'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:54:10 PM'
   ,'7/13/2013 5:54:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'347'
   ,'410'
   ,'1'
   ,'6'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:46:40 PM'
   ,'7/15/2013 12:46:40 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'63'
   ,'354'
   ,'417'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:19:38 PM'
   ,'7/17/2013 1:19:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'64'
   ,'353'
   ,'411'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:01:17 PM'
   ,'7/16/2013 10:01:17 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'65'
   ,'349'
   ,'399'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 4:18:44 PM'
   ,'7/13/2013 4:18:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'69'
   ,'349'
   ,'415'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:54:35 AM'
   ,'7/17/2013 9:54:35 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'69'
   ,'353'
   ,'412'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:27:08 PM'
   ,'7/16/2013 10:27:08 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'141'
   ,'382'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:06:20 AM'
   ,'6/26/2013 9:06:20 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'299'
   ,'383'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 9:08:55 AM'
   ,'6/26/2013 9:08:55 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'299'
   ,'384'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 11:28:39 AM'
   ,'6/26/2013 11:28:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'299'
   ,'413'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 8:51:49 AM'
   ,'7/17/2013 8:51:49 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'299'
   ,'414'
   ,'1'
   ,'5'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:49:39 AM'
   ,'7/17/2013 9:49:39 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'319'
   ,'385'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'6/26/2013 6:13:13 PM'
   ,'6/26/2013 6:13:13 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'334'
   ,'388'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:20:44 PM'
   ,'7/6/2013 3:20:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'334'
   ,'389'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:23:19 PM'
   ,'7/6/2013 3:23:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'344'
   ,'396'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 1:59:53 PM'
   ,'7/11/2013 1:59:53 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'55'
   ,'354'
   ,'416'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:17:33 PM'
   ,'7/17/2013 1:17:33 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'334'
   ,'386'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:11:10 PM'
   ,'7/6/2013 3:11:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'334'
   ,'387'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:16:52 PM'
   ,'7/6/2013 3:16:52 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'334'
   ,'390'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/6/2013 3:25:49 PM'
   ,'7/6/2013 3:25:49 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'335'
   ,'391'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 12:45:16 PM'
   ,'7/9/2013 12:45:16 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'337'
   ,'393'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:07:59 PM'
   ,'7/9/2013 3:07:59 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'337'
   ,'394'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 3:16:43 PM'
   ,'7/9/2013 3:16:43 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'338'
   ,'392'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/9/2013 2:31:26 PM'
   ,'7/9/2013 2:31:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'56'
   ,'338'
   ,'395'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/10/2013 11:10:41 AM'
   ,'7/10/2013 11:10:41 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'60'
   ,'344'
   ,'397'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:36:50 PM'
   ,'7/11/2013 3:36:50 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'60'
   ,'344'
   ,'398'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/11/2013 3:38:35 PM'
   ,'7/11/2013 3:38:35 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'141'
   ,'405'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:26:51 AM'
   ,'7/15/2013 11:26:51 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'141'
   ,'406'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 11:27:42 AM'
   ,'7/15/2013 11:27:42 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'141'
   ,'407'
   ,'1'
   ,'6'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:00:10 PM'
   ,'7/15/2013 12:00:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'141'
   ,'408'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:09:00 PM'
   ,'7/15/2013 12:09:00 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'141'
   ,'409'
   ,'1'
   ,'1'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:14:37 PM'
   ,'7/15/2013 12:14:37 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'347'
   ,'400'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:47:19 PM'
   ,'7/13/2013 5:47:19 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'347'
   ,'401'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:50:39 PM'
   ,'7/13/2013 5:50:39 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'347'
   ,'402'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:52:26 PM'
   ,'7/13/2013 5:52:26 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'347'
   ,'403'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 5:54:10 PM'
   ,'7/13/2013 5:54:10 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'347'
   ,'410'
   ,'1'
   ,'6'
   ,NULL
   ,NULL
   ,NULL
   ,'7/15/2013 12:46:40 PM'
   ,'7/15/2013 12:46:40 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'63'
   ,'354'
   ,'417'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 1:19:38 PM'
   ,'7/17/2013 1:19:38 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'64'
   ,'353'
   ,'411'
   ,'1'
   ,'2'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:01:17 PM'
   ,'7/16/2013 10:01:17 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'65'
   ,'349'
   ,'399'
   ,'1'
   ,'0'
   ,NULL
   ,NULL
   ,NULL
   ,'7/13/2013 4:18:44 PM'
   ,'7/13/2013 4:18:44 PM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'69'
   ,'349'
   ,'415'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/17/2013 9:54:35 AM'
   ,'7/17/2013 9:54:35 AM'
   ,'sys'
   ,'True')
INSERT INTO [PricingVariableValue]
   ([PricingVariableID]
   ,[ProviderPackageID]
   ,[UserID]
   ,[PricingEstimateID]
   ,[PricingEstimateRevision]
   ,[Value]
   ,[ProviderNumberIncluded]
   ,[ProviderMinNumberAllowed]
   ,[ProviderMaxNumberAllowed]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'69'
   ,'353'
   ,'412'
   ,'1'
   ,'3'
   ,NULL
   ,NULL
   ,NULL
   ,'7/16/2013 10:27:08 PM'
   ,'7/16/2013 10:27:08 PM'
   ,'sys'
   ,'True')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
