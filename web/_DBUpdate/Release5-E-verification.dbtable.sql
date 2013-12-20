
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM verification 
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('1'
   ,'Name'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'1'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('2'
   ,'Address'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'2'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('3'
   ,'SSN'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'3'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('4'
   ,'Phone'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'4'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('5'
   ,'DOJ Smart Search'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1'
   ,'5'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('6'
   ,'Criminal background check'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'2'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('7'
   ,'Full background check'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'3'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('8'
   ,'Facebook'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'3'
   ,'1'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('9'
   ,'Linked-in'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'3'
   ,'2'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('10'
   ,'Twitter'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'3'
   ,'3'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('11'
   ,'Loconomics'' user-reviewed'
   ,''
   ,''
   ,'share'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'2'
   ,'Review(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('12'
   ,'Reference(s) from former clients'
   ,''
   ,''
   ,'share'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'3'
   ,'Review(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('13'
   ,'Professional license'
   ,''
   ,''
   ,'license'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'1'
   ,'License(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('14'
   ,'Education'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'4'
   ,NULL
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('15'
   ,'Bonded'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/29/2012 12:00:00 AM'
   ,'4/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'4'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('16'
   ,'Insured'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'4/29/2012 12:00:00 AM'
   ,'4/29/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'5'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('17'
   ,'CPR certification'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('18'
   ,'First aid certification'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('19'
   ,'Infant CPR certification'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('20'
   ,'Infant first aid certification'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('21'
   ,'Driver''s license'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('22'
   ,'Automobile insurance'
   ,''
   ,''
   ,'verification'
   ,'1'
   ,'1'
   ,'9/25/2012 12:00:00 AM'
   ,'9/25/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'6'
   ,'6'
   ,'Verification(s)')
INSERT INTO [verification]
   ([VerificationID]
   ,[VerificationType]
   ,[VerificationDescription]
   ,[VerificationProcess]
   ,[Icon]
   ,[LanguageID]
   ,[CountryID]
   ,[CreatedDate]
   ,[ModifiedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[VerificationCategoryID]
   ,[RankPosition]
   ,[SummaryGroup])
VALUES
   ('23'
   ,'Professional certification'
   ,''
   ,''
   ,'license'
   ,'1'
   ,'1'
   ,'8/29/2013 12:00:00 AM'
   ,'8/29/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'5'
   ,'2'
   ,'License(s)')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
