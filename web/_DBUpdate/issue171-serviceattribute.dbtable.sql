
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM serviceattribute 
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1'
       ,'1'
       ,'1'
       ,'1'
       ,'Ironing'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('2'
       ,'1'
       ,'1'
       ,'1'
       ,'Mopping'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('3'
       ,'1'
       ,'1'
       ,'1'
       ,'Vacuuming'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('4'
       ,'1'
       ,'1'
       ,'1'
       ,'Sweeping'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('5'
       ,'1'
       ,'1'
       ,'1'
       ,'Dusting'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('6'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('7'
       ,'1'
       ,'1'
       ,'1'
       ,'Bed making'
       ,'Testing bed making description field!'
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('8'
       ,'1'
       ,'1'
       ,'1'
       ,'Wall cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('9'
       ,'1'
       ,'1'
       ,'1'
       ,'Floor waxing'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('10'
       ,'1'
       ,'1'
       ,'1'
       ,'Window cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('11'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpet cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('12'
       ,'1'
       ,'1'
       ,'1'
       ,'Upholstery cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('13'
       ,'1'
       ,'1'
       ,'1'
       ,'Pressure washing'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('14'
       ,'1'
       ,'1'
       ,'1'
       ,'Gutter cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('15'
       ,'1'
       ,'1'
       ,'1'
       ,'Bathroom cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('16'
       ,'1'
       ,'1'
       ,'1'
       ,'Refrigerator cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('17'
       ,'1'
       ,'1'
       ,'1'
       ,'Dish cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('18'
       ,'1'
       ,'1'
       ,'1'
       ,'Cleaning supplies'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('19'
       ,'1'
       ,'1'
       ,'1'
       ,'Move-in cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('20'
       ,'1'
       ,'1'
       ,'1'
       ,'Move-out cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('21'
       ,'1'
       ,'1'
       ,'1'
       ,'Spring cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('22'
       ,'1'
       ,'1'
       ,'1'
       ,'Deep cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('23'
       ,'1'
       ,'1'
       ,'1'
       ,'Insured'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('24'
       ,'1'
       ,'1'
       ,'1'
       ,'Bonded'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('25'
       ,'1'
       ,'1'
       ,'1'
       ,'English'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'0'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('25'
       ,'2'
       ,'2'
       ,'1'
       ,'Inglés'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'0'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('26'
       ,'1'
       ,'1'
       ,'1'
       ,'Spanish'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'-1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('26'
       ,'2'
       ,'2'
       ,'2'
       ,'Español'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'-1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('27'
       ,'1'
       ,'1'
       ,'1'
       ,'Chinese (Cantonese)'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('27'
       ,'2'
       ,'2'
       ,'1'
       ,'Chino (Cantonés)'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('28'
       ,'1'
       ,'1'
       ,'1'
       ,'Chinese (Mandarin)'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('28'
       ,'2'
       ,'2'
       ,'1'
       ,'Chino (Mandarín)'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('29'
       ,'1'
       ,'1'
       ,'1'
       ,'French'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('29'
       ,'2'
       ,'2'
       ,'1'
       ,'Francés'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('30'
       ,'1'
       ,'1'
       ,'1'
       ,'German'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'14'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('30'
       ,'2'
       ,'2'
       ,'1'
       ,'Alemán'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('31'
       ,'1'
       ,'1'
       ,'1'
       ,'Italian'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('31'
       ,'2'
       ,'2'
       ,'1'
       ,'Italiano'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('32'
       ,'1'
       ,'1'
       ,'1'
       ,'Tagalog'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('32'
       ,'2'
       ,'2'
       ,'1'
       ,'Tagalog'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('33'
       ,'1'
       ,'1'
       ,'1'
       ,'Vietnamese'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('33'
       ,'2'
       ,'2'
       ,'1'
       ,'Vietnamita'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('34'
       ,'1'
       ,'1'
       ,'1'
       ,'Korean'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('34'
       ,'2'
       ,'2'
       ,'1'
       ,'Coreano'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('35'
       ,'1'
       ,'1'
       ,'1'
       ,'Russian'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('35'
       ,'2'
       ,'2'
       ,'1'
       ,'Ruso'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('36'
       ,'1'
       ,'1'
       ,'1'
       ,'Polish'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('36'
       ,'2'
       ,'2'
       ,'1'
       ,'Polaco'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('37'
       ,'1'
       ,'1'
       ,'1'
       ,'Arabic'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('37'
       ,'2'
       ,'2'
       ,'1'
       ,'Árabe'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('38'
       ,'1'
       ,'1'
       ,'1'
       ,'Potuguese'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('38'
       ,'2'
       ,'2'
       ,'1'
       ,'Portugués'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('39'
       ,'1'
       ,'1'
       ,'1'
       ,'Japanese'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('39'
       ,'2'
       ,'2'
       ,'1'
       ,'Japoneés'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('40'
       ,'1'
       ,'1'
       ,'1'
       ,'French Creole'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('40'
       ,'2'
       ,'2'
       ,'1'
       ,'Criollo'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('41'
       ,'1'
       ,'1'
       ,'1'
       ,'Greek'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('41'
       ,'2'
       ,'2'
       ,'1'
       ,'Griego'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('42'
       ,'1'
       ,'1'
       ,'1'
       ,'Hindi'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('42'
       ,'2'
       ,'2'
       ,'1'
       ,'Hindú'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('43'
       ,'1'
       ,'1'
       ,'1'
       ,'Hmong'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('43'
       ,'2'
       ,'2'
       ,'1'
       ,'Hmong'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('44'
       ,'1'
       ,'1'
       ,'1'
       ,'Elementary Math'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('44'
       ,'2'
       ,'2'
       ,'1'
       ,'Matemática Elemental'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('45'
       ,'1'
       ,'1'
       ,'1'
       ,'Algebra'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('45'
       ,'2'
       ,'2'
       ,'1'
       ,'Álgebra'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('46'
       ,'1'
       ,'1'
       ,'1'
       ,'Geometry'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('46'
       ,'2'
       ,'2'
       ,'1'
       ,'Geometría'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('47'
       ,'1'
       ,'1'
       ,'1'
       ,'Trigonometry'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('47'
       ,'2'
       ,'2'
       ,'1'
       ,'Trigonometría'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('48'
       ,'1'
       ,'1'
       ,'1'
       ,'Biology'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('48'
       ,'2'
       ,'2'
       ,'1'
       ,'Biología'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('49'
       ,'1'
       ,'1'
       ,'1'
       ,'Physics'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('49'
       ,'2'
       ,'2'
       ,'1'
       ,'Física'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('50'
       ,'1'
       ,'1'
       ,'1'
       ,'Learning materials'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('50'
       ,'2'
       ,'2'
       ,'1'
       ,'Material de Apendizaje'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('51'
       ,'1'
       ,'1'
       ,'1'
       ,'ACT'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('51'
       ,'2'
       ,'2'
       ,'1'
       ,'ACT'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('52'
       ,'1'
       ,'1'
       ,'1'
       ,'SAT'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the test takers analyze and solve problemsâ€”skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('52'
       ,'2'
       ,'2'
       ,'1'
       ,'SAT'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the test takers analyze and solve problemsâ€”skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('53'
       ,'1'
       ,'1'
       ,'1'
       ,'GRE'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section, while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('53'
       ,'2'
       ,'2'
       ,'1'
       ,'GRE'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section, while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('54'
       ,'1'
       ,'1'
       ,'1'
       ,'LSAT'
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia[1][2] administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('54'
       ,'2'
       ,'2'
       ,'1'
       ,'LSAT'
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia[1][2] administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('55'
       ,'1'
       ,'1'
       ,'1'
       ,'MCAT'
       ,'The Medical College Admission Test, commonly known as the MCAT, is a computer-based standardized examination for prospective medical students in the United States and Canada. It is designed to assess problem solving, critical thinking, written analysis, and writing skills in addition to knowledge of scientific concepts and principles.  The Verbal Reasoning, Physical Sciences, and Biological Sciences sections are in multiple-choice format. The Writing sample consists of two short essays that are typed into the computer. The passages and questions are predetermined, and thus do not change in difficulty depending on the performance of the test taker.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('55'
       ,'2'
       ,'2'
       ,'1'
       ,'MCAT'
       ,'The Medical College Admission Test, commonly known as the MCAT, is a computer-based standardized examination for prospective medical students in the United States and Canada. It is designed to assess problem solving, critical thinking, written analysis, and writing skills in addition to knowledge of scientific concepts and principles.  The Verbal Reasoning, Physical Sciences, and Biological Sciences sections are in multiple-choice format. The Writing sample consists of two short essays that are typed into the computer. The passages and questions are predetermined, and thus do not change in difficulty depending on the performance of the test taker.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('56'
       ,'1'
       ,'1'
       ,'1'
       ,'GMAT'
       ,'The Graduate Management Admission Test (GMAT) is a computer-adaptive standardized test in mathematics and the English language for measuring aptitude to succeed academically in graduate business studies.  The exam measures verbal, mathematical, and analytical writing skills that the examinee has developed over a long period of time in his or her education and work. Test takers answer questions in each of the three tested areas, and there are also two optional breaks; in general, the test takes about four hours to complete.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('56'
       ,'2'
       ,'2'
       ,'1'
       ,'GMAT'
       ,'The Graduate Management Admission Test (GMAT) is a computer-adaptive standardized test in mathematics and the English language for measuring aptitude to succeed academically in graduate business studies.  The exam measures verbal, mathematical, and analytical writing skills that the examinee has developed over a long period of time in his or her education and work. Test takers answer questions in each of the three tested areas, and there are also two optional breaks; in general, the test takes about four hours to complete.'
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('57'
       ,'1'
       ,'1'
       ,'1'
       ,'Acupressure '
       ,'Acupressure (a portmanteau of "acupuncture" and "pressure") is aÂ traditional Chinese medicineÂ (TCM) technique derived from acupuncture. With acupressure physical pressure is applied to acupuncture points by the hand, elbow, or with various devices.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('58'
       ,'1'
       ,'1'
       ,'1'
       ,'Balinese '
       ,'Balinese massage techniques are gentle and aim to make the patient feel relaxed and calm throughout. The techniques include skin folding, kneading, stroking,and other techniques. The massage therapist applies aromatheraphy oil throughout the massage. A patient''''s blood, oxygen and energy flow is said to increase as a result of the treatment.[citation needed]Â Balinese hot stones are an option.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('59'
       ,'1'
       ,'1'
       ,'1'
       ,'Ayurvedic '
       ,'AyurvedaÂ is a natural health care system originating inÂ IndiaÂ that incorporates massage,Â yoga,Â meditationÂ andÂ herbalÂ remedies. Ayurvedic massage, also known asÂ AbhyanghaÂ is usually performed by one or two therapists using a heated blend of herbal oils based on the ayurvedic system ofÂ humors.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('60'
       ,'1'
       ,'1'
       ,'1'
       ,'Anma '
       ,'Anma is a traditional Japanese massage involving kneading and deep tissue work.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('61'
       ,'1'
       ,'1'
       ,'1'
       ,'Barefoot deep tissue '
       ,'Barefoot deep tissue, also known as barefoot compressive deep tissue, or barefoot sports massage, is a blend of Eastern barefoot techniques, such as barefoot Shiatsu massage, coupled with a Western manual medicine, encompassing deep tissue, myofascial release, trigger point therapy, transverse friction, compression, tension, shear, PNF, stretching, as well as parasympathetic response, on clothed clients using no oil.Â Dara Torres, 41-year-old Olympian, received barefoot compression massage on a daily basis in her training program.[20]
This modality typically uses the heel, sesamoid, arch and/or whole plantar surface of foot, and offers large compression, tension and shear forces with less pressure than elbow or thumb, and is ideal for large muscles, such as in thigh, or for long-duration upper trapezius compressions.[21]Â The unclothed cousins of this modality are Keralite, Yumeiho, Barefoot Lomi Lomi, Fijian Barefoot, Chavutti Thirummal.
Ashiatsu Oriental Bar Therapy, which is a form of barefoot effleurage, combines western science and contemporary American ingenuity, for therapists who specialize in deep tissue work using Swedish techniques performed by the massage therapist''''s feet.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('62'
       ,'1'
       ,'1'
       ,'1'
       ,'Bowen therapy'
       ,'Bowen technique involves a rolling movement over fascia, muscles, ligaments, tendons and joints. It is said not to involve deep or prolonged contact with muscle tissues as in most kinds of massage, but claims to relieve muscle tensions and strains and to restore normal lymphatic flow. Because this technique is so gentle, so Bowen Therapy can be suitable for newborn baby to elderly. It is based on practices developed by Australian Tom Bowen.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('63'
       ,'1'
       ,'1'
       ,'1'
       ,'Breema '
       ,'Breema bodywork is performed on the floor with the recipient fully clothed. It consists of rhythmical and gentle leans and stretches.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('64'
       ,'1'
       ,'1'
       ,'1'
       ,'Champissage '
       ,'Champissage is a massage technique focusing on the head, neck and face that is believed to balance theÂ chakras.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('65'
       ,'1'
       ,'1'
       ,'1'
       ,'Deep tissue '
       ,'Deep tissue massage is designed to relieve severe tension in the muscle and the connective tissue orÂ fascia. This type of massage focuses on the muscles located below the surface of the top muscles. Deep tissue massage is often recommended for individuals who experience consistent pain, are involved in heavy physical activity (such as athletes), and patients who have sustained physical injury. It is not uncommon for receivers of deep tissue massage to have their pain replaced with a new muscle ache for a day or two. Deep tissue work varies greatly.
The term â€œdeep tissueâ€ is often misused to identify a massage that is performed with sustained deep pressure. Deep tissue massage is a separate category of massage therapy, used to treat particular muscular-skeletal disorders and complaints and employs a dedicated set of techniques and strokes to achieve a measure of relief. It should not be confused with â€œdeep pressureâ€ massage, which is one that is performed with sustained strong, occasionally intense pressure throughout an entire full-body session, and that is not performed to address a specific complaint. Deep tissue massage is applied to both the superficial and deep layers of muscles, fascia, and other structures. The sessions are often quite intense as a result of the deliberate, focused work. When a client asks for a massage and uses the term â€œdeep tissueâ€, more often than not he or she is seeking to receive a full-body session with sustained deep pressure throughout. If a practitioner employs deep tissue techniques on the entire body in one session, it would be next to impossible to perform; it might lead to injury or localized muscle and nerve trauma, thereby rendering the session counterproductive.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('66'
       ,'1'
       ,'1'
       ,'1'
       ,'Esalen '
       ,'Esalen Massage was developed byÂ Charlotte SelverÂ and works with gentle rocking of the body, passive joint exercises and deep structural work on the muscles and joints, together with an "energetic balancing" of the body.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('67'
       ,'1'
       ,'1'
       ,'1'
       ,'Hilot '
       ,'Hilot is a traditional healing technique from the Philippines that also includes massage techniques. The massage techniques relax stressed muscles. Hilot also includes joint manipulations to help relax stressed muscles.
Hilot encompasses a wide variety of techniques beyond the treatment of stressed muscles. Hilot can be used to reset sprained joints, diagnose and treat musculoligamentous and musculoskeletal ailments, and even to aid in giving birth and to induce abortion.
Dislocated joints can also be reset by hilot after an X-ray has been done on affected body parts and medical experts advised that the same body parts are safe to be massaged.
After giving birth, hilot can be done on the mother and the baby born of normal delivery for 10 consecutive days so that they may recover easily. Hilot should not be done on mothers who deliver via caesarian section.
Hilot also uses banana leaves and herbs for enhanced efficacy.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('68'
       ,'1'
       ,'1'
       ,'1'
       ,'Lomi Lomi'
       ,'LomilomiÂ is the traditional massage ofÂ Hawaii. As an indigenous practice, it varies by island and by family. The wordÂ lomilomiÂ also is used for massage inÂ SamoaÂ and East Futuna. In Samoa, it is also known asÂ lolomiÂ andÂ milimili. In East Futuna, it is also calledÂ milimili, fakasolosolo, amoamo, lusilusi, kinikini, faiâ€™ua.Â TheÂ MaoriÂ call itÂ roromiÂ andÂ mirimiri. InÂ TongaÂ massage isÂ fotofota, tolotolo,Â andamoamo.Â InÂ TahitiÂ it isÂ rumirumi.Â OnÂ NanumeaÂ inÂ Tuvalu, massage is known asÂ popo, pressure application isÂ kukumi, and heat application isÂ tutu. '
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('69'
       ,'1'
       ,'1'
       ,'1'
       ,'Meso-American '
       ,'In Meso-America as in other areas of the world an indigenous form of soft tissue and structural massage has developed. Today this art survives thanks to the many Sobadoras/es or Hueseros/as that have handed-down these techniques via oral tradition.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('70'
       ,'1'
       ,'1'
       ,'1'
       ,'Mobile '
       ,'Given some of the main benefits of massage, many people prefer to have a therapist come to them to perform the treatment as opposed to visiting the therapist. Amongst other things, this type of treatment has the benefits of allowing the recipient to remain in their own environment with which they are likely most comfortable, to avoid the pre and post stresses of travelling to the therapist to receive their massage and of course to retire directly to a place of rest immediately following their massage. Therapists can bring a dedicated table with them on which to perform the massage or perform the treatment on the floor or the client''''s own bed. Mobile (or outcall) massages are particularly popular in big cities around the world where life can be more hectic than elsewhere and there are many operators of such services in places like London and New York.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('71'
       ,'1'
       ,'1'
       ,'1'
       ,'Myofascial release '
       ,'Myofascial release refers to the manual massage technique forÂ stretchingÂ theÂ fasciaÂ and releasing bonds between fascia,Â integument, andÂ musclesÂ with the goal of eliminatingÂ pain, increasingÂ range of motionÂ andÂ equilibrioception. Myofascial release usually involves applying shear compression or tension in various directions, or by skin rolling.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('72'
       ,'1'
       ,'1'
       ,'1'
       ,'Myomassology'
       ,'An integration of techniques including basicÂ Swedish massage,Â aromatherapy,Â reflexology, shiatsu, energy balancing, andÂ craniosacral therapyÂ along with other modalities in conjunction with instruction in nutrition, meditation andÂ yoga. The term Myomassology was coined byÂ Irene GauthierÂ to describe her combined work ofÂ Swedish massage, craniosacral therapy, reflexology and body mechanics.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('73'
       ,'1'
       ,'1'
       ,'1'
       ,'Postural integration (PI)'
       ,'Postural Integration (PI) is a process-oriented bodywork combining deep tissue massage with breathwork, body movement and awareness as well as emotional expression.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('74'
       ,'1'
       ,'1'
       ,'1'
       ,'Reflexology '
       ,'Reflexology is based on the principle that there are reflexes in the hands and feet that relate to every organ, gland, and system of the body.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('75'
       ,'1'
       ,'1'
       ,'1'
       ,'Shiatsu'
       ,'A few various techniques that are practiced on oneself, such as stroking the temples with strong pressure from front to back, rubbing the bottoms of the feet with one''''s knuckles or a wooden massage tool, and circular movement with thumb on palm of hand.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('76'
       ,'1'
       ,'1'
       ,'1'
       ,'Stone '
       ,'Shiatsu (shiÂ meaning finger andÂ atsuÂ meaning pressure) is a Japanese therapy that uses pressure applied with thumbs, fingers and palms to the same energy meridians asÂ acupressureÂ and incorporatesÂ stretching. It also uses techniques such as rolling, brushing, vibrating, grasping and, in one particular technique developed by Suzuki Yamamoto, pressure is applied with the feet on the person''''s back, legs and feet.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('77'
       ,'1'
       ,'1'
       ,'1'
       ,'Structural integration'
       ,'Structural integration''''s aim is to unwind the strain patterns residing in your body''''s myofascial system, restoring it to its natural balance, alignment, length, and ease. This is accomplished by deep, slow, fascial and myofascial manipulation, coupled with movement re-education. Various brands of Structural Integration areÂ Kinesis Myofascial IntegrationÂ andÂ rolfing.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('78'
       ,'1'
       ,'1'
       ,'1'
       ,'Swedish '
       ,'Swedish massage uses five styles of long, flowing strokes to massage. The five basic strokes areÂ effleurageÂ (sliding or gliding),Â petrissageÂ (kneading),Â tapotementÂ (rhythmic tapping), friction (cross fiber) and vibration/shaking.Â Swedish massage has shown to be helpful in reducing pain,Â joint stiffness, and improving function in patients withÂ osteoarthritisÂ of the knee over a period of eight weeks.Â It has also been shown to be helpful in individuals with poor circulation.  The term "Swedish" massage is actually only recognized in English or Dutch speaking countries. Elsewhere the style is referred to as "classic massage".'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('79'
       ,'1'
       ,'1'
       ,'1'
       ,'Thai '
       ,'Known in Thailand as Nuat phaen boran,Â IPA, meaning "ancient/traditional massage", Thai massage originated in India and is based on ayurveda andÂ yoga. The technique combines massage with yoga-like positions during the course of the massage; the northern style emphasizes stretching while the southern style emphasizes acupressure.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('80'
       ,'1'
       ,'1'
       ,'1'
       ,'Traditional Chinese '
       ,'Two types of traditional Chinese massage exist -Â Tui na which focuses on pushing, stretching and kneading the muscle and Zhi Ya which focuses on pinching and pressing atacupressureÂ points. Both are based on principles fromÂ Traditional Chinese Medicine. Though in the Western countries Tui Na is viewed as massage, it is not. Massage of Chinese Medicine is known as Anmo, which is the foundation of Japan''''s Anma.
Tui Na is Chinese Medicine''''s Physio-Therapy. Utilized for medical purposes instead of relaxation, Tui Na works to correct the patient''''s problems, from musculoskeletal conditions, to diseases, cancers and even minor and major headaches.
Within the foundation of Tui Na, Traditional Chinese Medicine principles are followed, from Meridian Applications to Herbal Formulas, Qigong Therapy and heated herbal application (Moxa). Technique applications such as friction and vibration are used as well.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('81'
       ,'1'
       ,'1'
       ,'1'
       ,'Trager approach'
       ,'The Trager approach combines movement, massage and education.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('82'
       ,'1'
       ,'1'
       ,'1'
       ,'Trigger point therapy'
       ,'Sometimes confused with pressure point massage,Â this involves deactivatingÂ trigger pointsÂ that may cause local pain or refer pain and other sensations, such as headaches, in other parts of the body. Manual pressure, vibration, injection, or other treatment is applied to these points to relieve myofascial pain. Trigger points were first discovered and mapped byÂ Janet G. TravellÂ (president Kennedy''''s physician) andÂ David Simons.  These points relate to dysfunction in theÂ myoneural junction, also calledÂ neuromuscular junctionÂ (NMJ), in muscle, and therefore this modality is different from reflexology, acupressure and pressure point massage.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('83'
       ,'1'
       ,'1'
       ,'1'
       ,'Visceral manipulation'
       ,'One form is Mayan abdominal massage which is practiced in many countries in Latin America. This type of massage was developed byÂ Elijio PantiÂ of Belize and brought to the United States by Rosita Arvigo. Even though Panti was a respected and well known user of Mayan massage, he did not develop this modality. "Mayan Massage" techniques have been used since before the Spanish conquest and is still practiced today by many Sobadores or Hueseros (Bonesetters).'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('84'
       ,'1'
       ,'1'
       ,'1'
       ,'Watsu'
       ,'Watsu is the combination ofÂ hydrotherapyÂ andÂ shiatsuÂ developed byÂ Harold Dull. The work is done in skin temperature water with both the therapist and practitioner in the water, usually a pool which is between 3.5Â ft to 4Â ft (100â€“120Â cm) deep. The work entails much movement in the water and practitioners believe that it incorporates the activation of the energy lines derived from shiatsu.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('85'
       ,'1'
       ,'1'
       ,'1'
       ,'Fine art moving'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('85'
       ,'2'
       ,'2'
       ,'1'
       ,'Mudanza de Arte'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('86'
       ,'1'
       ,'1'
       ,'1'
       ,'Piano moving'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('86'
       ,'2'
       ,'2'
       ,'1'
       ,'Mudanza de Pianos'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('87'
       ,'1'
       ,'1'
       ,'1'
       ,'Own vehicle'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('87'
       ,'2'
       ,'2'
       ,'1'
       ,'Vehículo Propio'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('88'
       ,'1'
       ,'1'
       ,'1'
       ,'Packaging material'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('88'
       ,'2'
       ,'2'
       ,'1'
       ,'Material de Embalaje'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('89'
       ,'1'
       ,'1'
       ,'1'
       ,'Packaging service'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('89'
       ,'2'
       ,'2'
       ,'1'
       ,'Servicio de Embalaje'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('90'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('91'
       ,'1'
       ,'1'
       ,'1'
       ,'Swimming'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('92'
       ,'1'
       ,'1'
       ,'1'
       ,'Basketball'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('93'
       ,'1'
       ,'1'
       ,'1'
       ,'Baseball'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('94'
       ,'1'
       ,'1'
       ,'1'
       ,'Soccer'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('95'
       ,'1'
       ,'1'
       ,'1'
       ,'Football'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('96'
       ,'1'
       ,'1'
       ,'1'
       ,'Soccer'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('97'
       ,'1'
       ,'1'
       ,'1'
       ,'Running'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('98'
       ,'1'
       ,'1'
       ,'1'
       ,'Golf'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('99'
       ,'1'
       ,'1'
       ,'1'
       ,'Bowling'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('100'
       ,'1'
       ,'1'
       ,'1'
       ,'Billiards'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('101'
       ,'1'
       ,'1'
       ,'1'
       ,'Cricket'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('102'
       ,'1'
       ,'1'
       ,'1'
       ,'Water Polo'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('103'
       ,'1'
       ,'1'
       ,'1'
       ,'Polo'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('104'
       ,'1'
       ,'1'
       ,'1'
       ,'Rugby'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('105'
       ,'1'
       ,'1'
       ,'1'
       ,'Green cleaning products'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('106'
       ,'1'
       ,'1'
       ,'1'
       ,'Cleaning products'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('107'
       ,'1'
       ,'1'
       ,'1'
       ,'Facebook verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('108'
       ,'1'
       ,'1'
       ,'1'
       ,'Twitter verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('109'
       ,'1'
       ,'1'
       ,'1'
       ,'Linked-in verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('110'
       ,'1'
       ,'1'
       ,'1'
       ,'Criminal background checked'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('111'
       ,'1'
       ,'1'
       ,'1'
       ,'SSN verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('112'
       ,'1'
       ,'1'
       ,'1'
       ,'Name verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('113'
       ,'1'
       ,'1'
       ,'1'
       ,'Address verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('114'
       ,'1'
       ,'1'
       ,'1'
       ,'Phone number verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('115'
       ,'1'
       ,'1'
       ,'1'
       ,'Professional license verified'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('116'
       ,'1'
       ,'1'
       ,'1'
       ,'Residential'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('117'
       ,'1'
       ,'1'
       ,'1'
       ,'Business'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('118'
       ,'1'
       ,'1'
       ,'1'
       ,'Catalan'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('119'
       ,'1'
       ,'1'
       ,'1'
       ,'Oven cleaning'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('120'
       ,'2'
       ,'2'
       ,'1'
       ,'Autónomo Verificado'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('121'
       ,'2'
       ,'2'
       ,'1'
       ,'Desplazamiento a Domicilio'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('122'
       ,'2'
       ,'2'
       ,'1'
       ,'Pintura'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('123'
       ,'2'
       ,'2'
       ,'1'
       ,'Manicura'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('124'
       ,'2'
       ,'2'
       ,'1'
       ,'Pedicura'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('125'
       ,'2'
       ,'2'
       ,'1'
       ,'Depilación con Cera'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('126'
       ,'2'
       ,'2'
       ,'1'
       ,'Limpieza Facial'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('127'
       ,'2'
       ,'2'
       ,'1'
       ,'Reparación de Ordenadores'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('128'
       ,'2'
       ,'2'
       ,'1'
       ,'Instalación de Software'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('129'
       ,'2'
       ,'2'
       ,'1'
       ,'Formateado de Ordenador'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('130'
       ,'2'
       ,'2'
       ,'1'
       ,'Estudio Propio'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('131'
       ,'2'
       ,'2'
       ,'1'
       ,'Repertorio Propio'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('132'
       ,'2'
       ,'2'
       ,'1'
       ,'Rock'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('133'
       ,'2'
       ,'2'
       ,'1'
       ,'Indie'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('134'
       ,'2'
       ,'2'
       ,'1'
       ,'Tecno'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('135'
       ,'2'
       ,'2'
       ,'1'
       ,'House'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('136'
       ,'2'
       ,'2'
       ,'1'
       ,'60´s'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('137'
       ,'2'
       ,'2'
       ,'1'
       ,'70´s'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('138'
       ,'2'
       ,'2'
       ,'1'
       ,'80´s'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('139'
       ,'2'
       ,'2'
       ,'1'
       ,'90´s'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('140'
       ,'2'
       ,'2'
       ,'1'
       ,'Contemporánea'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('141'
       ,'2'
       ,'2'
       ,'1'
       ,'Latino'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('142'
       ,'2'
       ,'2'
       ,'1'
       ,'Reggaeton'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('143'
       ,'2'
       ,'2'
       ,'1'
       ,'Pop'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('144'
       ,'2'
       ,'2'
       ,'1'
       ,'Depilación con Hilo'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('145'
       ,'2'
       ,'2'
       ,'1'
       ,'Equipo Propio'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('146'
       ,'2'
       ,'2'
       ,'1'
       ,'Productos Propios'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('147'
       ,'2'
       ,'2'
       ,'1'
       ,'Instalación de Parquet/Tarima'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('148'
       ,'2'
       ,'2'
       ,'1'
       ,'Derribo/Construcción de Tabiques'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('149'
       ,'2'
       ,'2'
       ,'1'
       ,'Alicatado'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('150'
       ,'2'
       ,'2'
       ,'1'
       ,'Instalación de Ventanas'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('151'
       ,'2'
       ,'2'
       ,'1'
       ,'Instalación de Aislamientos'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'fg'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('152'
       ,'1'
       ,'1'
       ,'1'
       ,'Aerobics'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('153'
       ,'1'
       ,'1'
       ,'1'
       ,'Baseball'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('154'
       ,'1'
       ,'1'
       ,'1'
       ,'Basketball'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('155'
       ,'1'
       ,'1'
       ,'1'
       ,'Bicycling'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('156'
       ,'1'
       ,'1'
       ,'1'
       ,'Bodyweight training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('157'
       ,'1'
       ,'1'
       ,'1'
       ,'Bodybuilding'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('158'
       ,'1'
       ,'1'
       ,'1'
       ,'Boot camp'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('159'
       ,'1'
       ,'1'
       ,'1'
       ,'Boxing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('160'
       ,'1'
       ,'1'
       ,'1'
       ,'Cardio '
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('161'
       ,'1'
       ,'1'
       ,'1'
       ,'Choreography'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('162'
       ,'1'
       ,'1'
       ,'1'
       ,'Circuit training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('163'
       ,'1'
       ,'1'
       ,'1'
       ,'Core conditioning'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('164'
       ,'1'
       ,'1'
       ,'1'
       ,'Cross country'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('165'
       ,'1'
       ,'1'
       ,'1'
       ,'Cycling'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('166'
       ,'1'
       ,'1'
       ,'1'
       ,'Dancing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('167'
       ,'1'
       ,'1'
       ,'1'
       ,'Diving'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('168'
       ,'1'
       ,'1'
       ,'1'
       ,'Equestrian'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('169'
       ,'1'
       ,'1'
       ,'1'
       ,'Football'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('170'
       ,'1'
       ,'1'
       ,'1'
       ,'Golfing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('171'
       ,'1'
       ,'1'
       ,'1'
       ,'Gymnastics'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('172'
       ,'1'
       ,'1'
       ,'1'
       ,'Gyrokinesis'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('173'
       ,'1'
       ,'1'
       ,'1'
       ,'Hiking'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('174'
       ,'1'
       ,'1'
       ,'1'
       ,'Hockey'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('175'
       ,'1'
       ,'1'
       ,'1'
       ,'Ice skating'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('176'
       ,'1'
       ,'1'
       ,'1'
       ,'Jogging'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('177'
       ,'1'
       ,'1'
       ,'1'
       ,'Kettlebells'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('178'
       ,'1'
       ,'1'
       ,'1'
       ,'Kickboxing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('179'
       ,'1'
       ,'1'
       ,'1'
       ,'Lacrosse'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('180'
       ,'1'
       ,'1'
       ,'1'
       ,'Martial arts'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('181'
       ,'1'
       ,'1'
       ,'1'
       ,'Meditation'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('182'
       ,'1'
       ,'1'
       ,'1'
       ,'Mixed martial arts'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('183'
       ,'1'
       ,'1'
       ,'1'
       ,'Nia'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('184'
       ,'1'
       ,'1'
       ,'1'
       ,'Nordic walking'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('185'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('186'
       ,'1'
       ,'1'
       ,'1'
       ,'Pilates'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('187'
       ,'1'
       ,'1'
       ,'1'
       ,'Rollerblading'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('188'
       ,'1'
       ,'1'
       ,'1'
       ,'Rowing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('189'
       ,'1'
       ,'1'
       ,'1'
       ,'Running'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('190'
       ,'1'
       ,'1'
       ,'1'
       ,'Skiing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('191'
       ,'1'
       ,'1'
       ,'1'
       ,'Snowboarding'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('192'
       ,'1'
       ,'1'
       ,'1'
       ,'Soccer'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('193'
       ,'1'
       ,'1'
       ,'1'
       ,'Softball'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('194'
       ,'1'
       ,'1'
       ,'1'
       ,'Stretching'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('195'
       ,'1'
       ,'1'
       ,'1'
       ,'Surfing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('196'
       ,'1'
       ,'1'
       ,'1'
       ,'Swimming'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('197'
       ,'1'
       ,'1'
       ,'1'
       ,'Tai Chi'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('198'
       ,'1'
       ,'1'
       ,'1'
       ,'Tennis'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('199'
       ,'1'
       ,'1'
       ,'1'
       ,'Track and field'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('200'
       ,'1'
       ,'1'
       ,'1'
       ,'Trail funning'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('201'
       ,'1'
       ,'1'
       ,'1'
       ,'Triathlon'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('202'
       ,'1'
       ,'1'
       ,'1'
       ,'TRX (suspension training)'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('203'
       ,'1'
       ,'1'
       ,'1'
       ,'Volleyball'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('204'
       ,'1'
       ,'1'
       ,'1'
       ,'Walking'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('205'
       ,'1'
       ,'1'
       ,'1'
       ,'Water fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('206'
       ,'1'
       ,'1'
       ,'1'
       ,'Aerobics'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('207'
       ,'1'
       ,'1'
       ,'1'
       ,'Athletic training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('208'
       ,'1'
       ,'1'
       ,'1'
       ,'Back pain'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('209'
       ,'1'
       ,'1'
       ,'1'
       ,'Biomechanics'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('210'
       ,'1'
       ,'1'
       ,'1'
       ,'Bodybuilding'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('211'
       ,'1'
       ,'1'
       ,'1'
       ,'Cardio workouts'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('212'
       ,'1'
       ,'1'
       ,'1'
       ,'Clinical Exercise Physiologist'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('213'
       ,'1'
       ,'1'
       ,'1'
       ,'Core training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('214'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate wellness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('215'
       ,'1'
       ,'1'
       ,'1'
       ,'Diet and nutrition'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('216'
       ,'1'
       ,'1'
       ,'1'
       ,'Executive fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('217'
       ,'1'
       ,'1'
       ,'1'
       ,'Exercise physiology'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('218'
       ,'1'
       ,'1'
       ,'1'
       ,'Family fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('219'
       ,'1'
       ,'1'
       ,'1'
       ,'Fat loss'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('220'
       ,'1'
       ,'1'
       ,'1'
       ,'Fitness assessment'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('221'
       ,'1'
       ,'1'
       ,'1'
       ,'Fitness education'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('222'
       ,'1'
       ,'1'
       ,'1'
       ,'Flexibility'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('223'
       ,'1'
       ,'1'
       ,'1'
       ,'Food and cooking'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('224'
       ,'1'
       ,'1'
       ,'1'
       ,'Group exercise'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('225'
       ,'1'
       ,'1'
       ,'1'
       ,'Injury prevention'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('226'
       ,'1'
       ,'1'
       ,'1'
       ,'Kickboxing'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('227'
       ,'1'
       ,'1'
       ,'1'
       ,'Kids'' fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('228'
       ,'1'
       ,'1'
       ,'1'
       ,'Kinesiology'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('229'
       ,'1'
       ,'1'
       ,'1'
       ,'Lifestyle coaching'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('230'
       ,'1'
       ,'1'
       ,'1'
       ,'Massage therapy'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('231'
       ,'1'
       ,'1'
       ,'1'
       ,'Medical fitness for chronic conditions'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('232'
       ,'1'
       ,'1'
       ,'1'
       ,'Men''s fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('233'
       ,'1'
       ,'1'
       ,'1'
       ,'Mind-body fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('234'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutrition'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('235'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutrition coaching'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('236'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('237'
       ,'1'
       ,'1'
       ,'1'
       ,'Physical therapy'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('238'
       ,'1'
       ,'1'
       ,'1'
       ,'Plyometrics'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('239'
       ,'1'
       ,'1'
       ,'1'
       ,'Postnatal fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('240'
       ,'1'
       ,'1'
       ,'1'
       ,'Postrehab/Injury recovery'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('241'
       ,'1'
       ,'1'
       ,'1'
       ,'Prenatal fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('242'
       ,'1'
       ,'1'
       ,'1'
       ,'Rehabilitation'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('243'
       ,'1'
       ,'1'
       ,'1'
       ,'Senior fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('244'
       ,'1'
       ,'1'
       ,'1'
       ,'Speed and agility training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('245'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports conditioning'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('246'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports nutrition'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('247'
       ,'1'
       ,'1'
       ,'1'
       ,'Strength training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('248'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress management'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('249'
       ,'1'
       ,'1'
       ,'1'
       ,'Toning and general fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('250'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight loss'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('251'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight management'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('252'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('253'
       ,'1'
       ,'1'
       ,'1'
       ,'Wellness coaching'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('254'
       ,'1'
       ,'1'
       ,'1'
       ,'Women''s fitness'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('255'
       ,'1'
       ,'1'
       ,'1'
       ,'Architecture'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('255'
       ,'2'
       ,'2'
       ,'1'
       ,'Arquitectura'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('256'
       ,'1'
       ,'1'
       ,'1'
       ,'Animals'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('256'
       ,'2'
       ,'2'
       ,'1'
       ,'Animales'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('257'
       ,'1'
       ,'1'
       ,'1'
       ,'Aerial'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('257'
       ,'2'
       ,'2'
       ,'1'
       ,'Aérea'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('258'
       ,'1'
       ,'1'
       ,'1'
       ,'Children'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('258'
       ,'2'
       ,'2'
       ,'1'
       ,'Niños'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('259'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('259'
       ,'2'
       ,'2'
       ,'1'
       ,'Bodas'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('260'
       ,'1'
       ,'1'
       ,'1'
       ,'Portrait'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('260'
       ,'2'
       ,'2'
       ,'1'
       ,'Retratos'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('261'
       ,'1'
       ,'1'
       ,'1'
       ,'Real estate'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('261'
       ,'2'
       ,'2'
       ,'1'
       ,'Inmobiliaria'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('262'
       ,'1'
       ,'1'
       ,'1'
       ,'Headshots'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('263'
       ,'1'
       ,'1'
       ,'1'
       ,'Events'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('263'
       ,'2'
       ,'2'
       ,'1'
       ,'Eventos'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('264'
       ,'1'
       ,'1'
       ,'1'
       ,'Commercial'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('264'
       ,'2'
       ,'2'
       ,'1'
       ,'Comercial'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('265'
       ,'1'
       ,'1'
       ,'1'
       ,'Underwater'
       ,'Specialties, photography'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('265'
       ,'2'
       ,'2'
       ,'1'
       ,'Submarina'
       ,'Especialidades, fotografía'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('266'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemical balancing'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('267'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemical testing'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('268'
       ,'1'
       ,'1'
       ,'1'
       ,'Empty pump basket'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('269'
       ,'1'
       ,'1'
       ,'1'
       ,'Empty sweep bag'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('270'
       ,'1'
       ,'1'
       ,'1'
       ,'Empty skimmer basket'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('271'
       ,'1'
       ,'1'
       ,'1'
       ,'Equipment inspection'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('272'
       ,'1'
       ,'1'
       ,'1'
       ,'Skim pool'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('273'
       ,'1'
       ,'1'
       ,'1'
       ,'Vacuum bottom'
       ,'Services performed pool cleaner'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('274'
       ,'1'
       ,'1'
       ,'1'
       ,'Infants'
       ,'Age groups, Babysitter'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('274'
       ,'2'
       ,'2'
       ,'1'
       ,'Bebés (0-12 meses)'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('275'
       ,'1'
       ,'1'
       ,'1'
       ,'Toddlers'
       ,'Age groups, Babysitter'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('275'
       ,'2'
       ,'2'
       ,'1'
       ,'1-4 años'
       ,'Grupos de edad, Canguro'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('276'
       ,'1'
       ,'1'
       ,'1'
       ,'4-6 years'
       ,'Age groups, Babysitter'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('276'
       ,'2'
       ,'2'
       ,'1'
       ,'4-6 años'
       ,'Grupos de edad, Canguro'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('277'
       ,'1'
       ,'1'
       ,'1'
       ,'6-10 years'
       ,'Age groups, Babysitter'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('277'
       ,'2'
       ,'2'
       ,'1'
       ,'6-10 años'
       ,'Grupos de edad, Canguro'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('278'
       ,'1'
       ,'1'
       ,'1'
       ,'11-15 years'
       ,'Age groups, Babysitter'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('278'
       ,'2'
       ,'2'
       ,'1'
       ,'11-15 años'
       ,'Grupos de edad, Canguro'
       ,NULL
       ,NULL
       ,NULL
       ,NULL
       ,'1'
       ,NULL)
ALTER TABLE serviceattribute WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE serviceattribute ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'