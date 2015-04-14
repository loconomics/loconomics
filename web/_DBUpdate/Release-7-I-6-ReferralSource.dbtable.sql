
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM ReferralSource 
INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('1'
   ,'Loconomics Marketplace')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('2'
   ,'Google search')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('3'
   ,'Bing search')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('4'
   ,'Yahoo search')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('5'
   ,'Yelp listing')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('6'
   ,'Friend/Colleage')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('7'
   ,'Existing client')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('8'
   ,'Friend of this provider')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('9'
   ,'Online advertisement')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('10'
   ,'Offline advertisement (bulleting board, brochure, newspaper)')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('11'
   ,'Other')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('12'
   ,'ProviderExistingClient')

INSERT INTO [ReferralSource]
   ([ReferralSourceID]
   ,[Name])
 VALUES
   ('13'
   ,'ProviderWebsite')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
