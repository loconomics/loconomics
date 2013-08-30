
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM alert 
INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('1'
   ,'2'
   ,'1'
   ,'1'
   ,'pricingdetails'
   ,'How much do your services cost?'
   ,'We''ll help you communicate accurate pricing'
   ,''
   ,''
   ,'5'
   ,'0'
   ,'4/24/2012 12:00:00 AM'
   ,'4/24/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-pricing'
   ,'True'
   ,'True'
   ,'4'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('2'
   ,'2'
   ,'1'
   ,'1'
   ,'availability'
   ,'When are you available to work?'
   ,'Let your customers know when you''re available'
   ,''
   ,''
   ,'5'
   ,'0'
   ,'4/24/2012 12:00:00 AM'
   ,'4/24/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Calendar/#availability-form'
   ,'True'
   ,'False'
   ,'3'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('3'
   ,'2'
   ,'1'
   ,'1'
   ,'personalinfo'
   ,'How do we reach you?'
   ,'Please fill in your name and contact information'
   ,''
   ,''
   ,'5'
   ,'0'
   ,'4/24/2012 12:00:00 AM'
   ,'4/24/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Account/#account-profile-contact'
   ,'True'
   ,'False'
   ,'10'
   ,'True'
   ,'True')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('4'
   ,'3'
   ,'1'
   ,'1'
   ,'photo'
   ,'Add your photo'
   ,'Please upload a photo using the ''Change Photo''  button on the left'
   ,NULL
   ,NULL
   ,'5'
   ,'0'
   ,'6/1/2012 12:00:00 AM'
   ,'6/1/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'javascript:(function(){$(''#changephoto'').click()})()'
   ,'False'
   ,'False'
   ,'5'
   ,'True'
   ,'True')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('5'
   ,'4'
   ,'1'
   ,'1'
   ,'payment'
   ,'How do you want to be paid?'
   ,'Direct deposit or check--it''s your choice'
   ,NULL
   ,NULL
   ,'5'
   ,'0'
   ,'6/1/2012 12:00:00 AM'
   ,'6/12/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Account/#account-payments-bankinfo'
   ,'False'
   ,'False'
   ,'1'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('6'
   ,'4'
   ,'1'
   ,'1'
   ,'taxdocs'
   ,'Fill out Federal tax requirements'
   ,'In order to comply with federal law, a W-9 form must be filled out.'
   ,NULL
   ,NULL
   ,'5'
   ,'0'
   ,'6/1/2012 12:00:00 AM'
   ,'6/12/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Account/#account-taxes'
   ,'False'
   ,'False'
   ,'2'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('8'
   ,'2'
   ,'1'
   ,'1'
   ,'positionservices'
   ,'What services do you provide?'
   ,'Complete the information about services you provide as part of your position'
   ,'Provider-sign-up step 2'
   ,NULL
   ,'20'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-services'
   ,'True'
   ,'True'
   ,'2'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('9'
   ,'3'
   ,'1'
   ,'1'
   ,'publicbio'
   ,'Write your bio!'
   ,'Tell us about yourself'
   ,NULL
   ,NULL
   ,'1'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Account/#account-profile-profile'
   ,'False'
   ,'False'
   ,'6'
   ,'True'
   ,'True')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('10'
   ,'3'
   ,'1'
   ,'1'
   ,'basicinfoverification'
   ,'Verify your basic info'
   ,'Complete the verification for your basic info'
   ,NULL
   ,NULL
   ,'10'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'False'
   ,'Dashboard/Account/#account-verifications'
   ,'False'
   ,'False'
   ,'1'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('11'
   ,'3'
   ,'1'
   ,'1'
   ,'socialmediaverification'
   ,'Link to social media'
   ,'Connect your Facebook, Twitter, and LinkedIn accounts.'
   ,NULL
   ,NULL
   ,'3'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Account/#account-verifications'
   ,'False'
   ,'False'
   ,'2'
   ,'True'
   ,'True')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('12'
   ,'3'
   ,'1'
   ,'1'
   ,'backgroundcheck'
   ,'Undergo a background check'
   ,'Help your customers feel more comfortable hiring your services.  '
   ,''
   ,NULL
   ,'10'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-backgroundcheck'
   ,'False'
   ,'True'
   ,'1'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('13'
   ,'3'
   ,'1'
   ,'1'
   ,'professionallicense'
   ,'Verify your professional license or certification'
   ,'Tell us what professional licenses/certifications you have (if applicable)'
   ,NULL
   ,NULL
   ,'5'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-licenses'
   ,'False'
   ,'True'
   ,'8'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('14'
   ,'3'
   ,'1'
   ,'1'
   ,'referencerequests'
   ,'Request references'
   ,'Send reference requests'
   ,NULL
   ,NULL
   ,'1'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-reviews'
   ,'False'
   ,'True'
   ,'3'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('15'
   ,'2'
   ,'1'
   ,'1'
   ,'verifyemail'
   ,'Verify your account (check your e-mail)'
   ,'Check your e-mail and verify your account'
   ,''
   ,''
   ,'0'
   ,'0'
   ,'7/13/2012 12:00:00 AM'
   ,'7/13/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Account/#account-verifications'
   ,'True'
   ,'False'
   ,'11'
   ,'True'
   ,'True')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('16'
   ,'2'
   ,'1'
   ,'1'
   ,'location'
   ,'Where can you work?'
   ,'Tell customers where you perform your services'
   ,''
   ,''
   ,'0'
   ,'0'
   ,'8/1/2012 12:00:00 AM'
   ,'8/1/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-locations'
   ,'True'
   ,'True'
   ,'9'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('17'
   ,'3'
   ,'1'
   ,'1'
   ,'showcasework'
   ,'Showcase your work'
   ,'Upload photos'
   ,''
   ,''
   ,'5'
   ,'0'
   ,'8/11/2012 12:00:00 AM'
   ,'8/11/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-photos'
   ,'False'
   ,'True'
   ,'1'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('18'
   ,'2'
   ,'1'
   ,'1'
   ,'required-backgroundcheck'
   ,'Undergo a background check'
   ,'Help your customers feel more comfortable hiring your services.  '
   ,NULL
   ,NULL
   ,'0'
   ,'0'
   ,'2/27/2013 12:00:00 AM'
   ,'2/27/2013 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-backgroundcheck'
   ,'True'
   ,'True'
   ,'1'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('19'
   ,'2'
   ,'1'
   ,'1'
   ,'required-professionallicense'
   ,'Verify your professional license or certification'
   ,'Tell us what professional licenses/certifications you have (if applicable)'
   ,NULL
   ,NULL
   ,'5'
   ,'0'
   ,'6/4/2012 12:00:00 AM'
   ,'6/4/2012 12:00:00 AM'
   ,'il'
   ,'True'
   ,'Dashboard/Positions/#position@(PositionID)-licenses'
   ,'True'
   ,'True'
   ,'8'
   ,'True'
   ,'False')

INSERT INTO [alert]
   ([AlertID]
   ,[AlertTypeID]
   ,[LanguageID]
   ,[CountryID]
   ,[AlertName]
   ,[AlertHeadlineDisplay]
   ,[AlertTextDisplay]
   ,[AlertDescription]
   ,[AlertEmailText]
   ,[ProviderProfileCompletePoints]
   ,[CustomerProfileCompletePoints]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[AlertPageURL]
   ,[Required]
   ,[PositionSpecific]
   ,[DisplayRank]
   ,[ProviderAlert]
   ,[CustomerAlert])
VALUES
   ('20'
   ,'3'
   ,'1'
   ,'1'
   ,'add-education'
   ,'Add relevant education'
   ,'Tell clients about any training or education you''ve done'
   ,''
   ,''
   ,'0'
   ,'0'
   ,'6/1/2013 12:00:00 AM'
   ,'6/1/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'Dashboard/Account/#account-profile-education'
   ,'False'
   ,'False'
   ,'11'
   ,'True'
   ,'False')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
