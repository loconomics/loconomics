
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM VOCElement 
INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('0'
   ,'1'
   ,'1'
   ,'General'
   ,NULL
   ,NULL
   ,NULL
   ,''
   ,''
   ,''
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'NPS'
   ,'0'
   ,'5'
   ,'10'
   ,'Not at all likely'
   ,'Neutral'
   ,'Extremely likely'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Sign-up process'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Calendar'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Inbox'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Scheduling'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Client management'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Payments'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Performance'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('9'
   ,'1'
   ,'1'
   ,'Marketplace profile'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('10'
   ,'1'
   ,'1'
   ,'Ease of using mobile/tablet app'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('11'
   ,'1'
   ,'1'
   ,'Ease of using desktop website'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('12'
   ,'1'
   ,'1'
   ,'Cooperative benefits'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('13'
   ,'1'
   ,'1'
   ,'Cooperative user fee'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('14'
   ,'1'
   ,'1'
   ,'Sense of community'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('15'
   ,'1'
   ,'1'
   ,'Customer service agents'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')

INSERT INTO [VOCElement]
   ([VOCElementID]
   ,[LanguageID]
   ,[CountryID]
   ,[VOCElementName]
   ,[ScoreStartValue]
   ,[ScoreMidValue]
   ,[ScoreEndValue]
   ,[ScoreStartLabel]
   ,[ScoreMidLabel]
   ,[ScoreEndLabel]
   ,[CreateDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('16'
   ,'1'
   ,'1'
   ,'Help pages'
   ,'1'
   ,'3'
   ,'5'
   ,'Not at all satisfied'
   ,'Neutral'
   ,'Extremely satisfied'
   ,'3/10/2015 12:00:00 AM'
   ,'3/10/2015 12:00:00 AM'
   ,'jd'
   ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
