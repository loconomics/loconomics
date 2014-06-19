
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM serviceattribute 
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Ironing on request'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Laundry on request'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Cabinet cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Vegetable planting'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Maintenance of fountains/waterfalls'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'1'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'1'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'2'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'1'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'3'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'4'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'5'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'6'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'7'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'8'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'9'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'10'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'11'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'12'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'13'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Portuguese'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'14'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'15'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'16'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'17'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'18'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'19'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section,while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'The Graduate Management Admission Test (GMAT) is a computer-adaptive standardized test in mathematics and the English language for measuring aptitude to succeed academically in graduate business studies.  The exam measures verbal, mathematical, and analytical writing skills that the examinee has developed over a long period of time in his or her education and work. Test takers answer questions in each of the three tested areas, and there are also two optional breaks; in general, the test takes about four hours to complete.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Ayurveda is a natural health care system originating in India that incorporates massage, yoga, meditation and herbal remedies. Ayurvedic massage, also known as Abhyangha is usually performed by one or two therapists using a heated blend of herbal oils based on the ayurvedic system of humors.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
The term deep tissue is often misused to identify a massage that is performed with sustained deep pressure. Deep tissue massage is a separate category of massage therapy, used to treat particular muscular-skeletal disorders and complaints and employs a dedicated set of techniques and strokes to achieve a measure of relief. It should not be confused with deep pressure massage, which is one that is performed with sustained strong, occasionally intense pressure throughout an entire full-body session, and that is not performed to address a specific complaint. Deep tissue massage is applied to both the superficial and deep layers of muscles, fascia, and other structures. The sessions are often quite intense as a result of the deliberate, focused work. When a client asks for a massage and uses the term deep tissue, more often than not he or she is seeking to receive a full-body session with sustained deep pressure throughout. If a practitioner employs deep tissue techniques on the entire body in one session, it would be next to impossible to perform; it might lead to injury or localized muscle and nerve trauma, thereby rendering the session counterproductive.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Esalen Massage was developed by Charlotte Selver and works with gentle rocking of the body, passive joint exercises and deep structural work on the muscles and joints, together with an "energetic balancing" of the body.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Lomilomi is the traditional massage of Hawaii. As an indigenous practice, it varies by island and by family. The word lomilomi also is used for massage in Samoa and East Futuna. In Samoa, it is also known as lolomi and milimili. In East Futuna, it is also called milimili, fakasolosolo, amoamo, lusilusi, kinikini, faiâua. The Maori call it roromi and mirimiri. In Tonga massage is fotofota, tolotolo, andamoamo. In Tahiti it is rumirumi. On Nanumea in Tuvalu, massage is known as popo, pressure application is kukumi, and heat application is tutu. '
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Shiatsu is a Japanese therapy that uses pressure applied with thumbs, fingers and palms to the same energy meridians as acupressure and incorporates stretching. It also uses techniques such as rolling, brushing, vibrating, grasping and, in one particular technique developed by Suzuki Yamamoto, pressure is applied with the feet on the person''s back, legs and feet.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'A stone massage uses cold or water-heated stones to apply pressure and heat to the body. Stones coated in oil can also be used by the therapist delivering various massaging strokes. The hot stones used are commonly Basalt stones (or lava rocks) which over time have become extremely polished and smooth. As the stones are placed along the recipient s back, they help to retain heat which then deeply penetrates into the muscles, releasing tension.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Swedish massage uses five styles of long, flowing strokes to massage. The five basic strokes are effleurage (sliding or gliding), petrissage (kneading), tapotement (rhythmic tapping), friction (cross fiber) and vibration/shaking.Â Swedish massage has shown to be helpful in reducing pain,Â joint stiffness, and improving function in patients withÂ osteoarthritisÂ of the knee over a period of eight weeks.Â It has also been shown to be helpful in individuals with poor circulation.  The term "Swedish" massage is actually only recognized in English or Dutch speaking countries. Elsewhere the style is referred to as "classic massage".'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Known in Thailand as Nuat phaen boran, IPA, meaning "ancient/traditional massage", Thai massage originated in India and is based on ayurveda and yoga. The technique combines massage with yoga-like positions during the course of the massage; the northern style emphasizes stretching while the southern style emphasizes acupressure.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Watsu is the combination of hydrotherapy and shiatsu developed by Harold Dull. The work is done in skin temperature water with both the therapist and practitioner in the water, usually a pool which is between 3.5 ft to 4 ft (100-120 cm) deep. The work entails much movement in the water and practitioners believe that it incorporates the activation of the energy lines derived from shiatsu.'
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ('90'
       ,'1'
       ,'1'
       ,'1'
       ,'Watering'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Weeding'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Raking'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Mowing'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Fertilizing'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Composting'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Mulching'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Pest control'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Maintenance of ponds'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Yard maintenance'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Fire protection'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Tree trimming'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Bush trimming'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Flower planting'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Irrigation'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Mop'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Men''s haircut'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Women''s short haircut (above chin)'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Women''s haircut (below chin, above shoulders)'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'4/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Children''s haircut'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Bangs/Maintenance trim'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Shampoo and blowdry'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Flat or curling iron'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Formal styling/updo'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Bridal updo'
       ,NULL
       ,'8/21/2011 12:00:00 AM'
       ,'8/21/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'20'
       ,'0')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'22'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Cycling'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Boot camps'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Triathlon'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Gyrotonic, Gyrokinesis'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Trail running'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Triathlon training'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'22'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Back pain prevention/postrehab'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'22'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'22'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Increased flexibility'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'Relief of chronic conditions'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'9'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'8'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'10'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'3'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'5'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'11'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'5'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'4'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'12'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'13'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'3')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
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
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('279'
       ,'1'
       ,'1'
       ,'1'
       ,'Watering plants'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('280'
       ,'1'
       ,'1'
       ,'1'
       ,'Collecting mail'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('281'
       ,'1'
       ,'1'
       ,'1'
       ,'Coordinating automobile servicing'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('282'
       ,'1'
       ,'1'
       ,'1'
       ,'Coordinating emergency services if needed'
       ,'This can include: plumbing, electrical, etc. as needed'
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('283'
       ,'1'
       ,'1'
       ,'1'
       ,'Ensursing security of property'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('284'
       ,'1'
       ,'1'
       ,'1'
       ,'Taking out trash'
       ,'Ensures your trash is taken out on collection day.'
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('285'
       ,'1'
       ,'1'
       ,'1'
       ,'Light housekeeping'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('286'
       ,'1'
       ,'1'
       ,'1'
       ,'Performing general maintenance'
       ,'Includes general maintenance of pools, lawns, air-conditioning systems etc.  Any skilled expertise needed will not be performed.'
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('287'
       ,'1'
       ,'1'
       ,'1'
       ,'Updating owner regularly by phone/e-mail'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('288'
       ,'1'
       ,'1'
       ,'1'
       ,'Removing snow from sidewalks'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('289'
       ,'1'
       ,'1'
       ,'1'
       ,'Drop-by'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('290'
       ,'1'
       ,'1'
       ,'1'
       ,'LIve-in'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('291'
       ,'1'
       ,'1'
       ,'1'
       ,'Pet sitting'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('292'
       ,'1'
       ,'1'
       ,'1'
       ,'Cat(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('293'
       ,'1'
       ,'1'
       ,'1'
       ,'Small dog(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('294'
       ,'1'
       ,'1'
       ,'1'
       ,'Medium dog(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('295'
       ,'1'
       ,'1'
       ,'1'
       ,'Large dog(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('296'
       ,'1'
       ,'1'
       ,'1'
       ,'Fish'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('297'
       ,'1'
       ,'1'
       ,'1'
       ,'Bird(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('298'
       ,'1'
       ,'1'
       ,'1'
       ,'Reptile(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('299'
       ,'1'
       ,'1'
       ,'1'
       ,'Small animal(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('300'
       ,'1'
       ,'1'
       ,'1'
       ,'Basic grooming'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('301'
       ,'1'
       ,'1'
       ,'1'
       ,'Feeding'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('302'
       ,'1'
       ,'1'
       ,'1'
       ,'Administering medication'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('303'
       ,'1'
       ,'1'
       ,'1'
       ,'Walking'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('304'
       ,'1'
       ,'1'
       ,'1'
       ,'Cleaning of litter box'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('305'
       ,'1'
       ,'1'
       ,'1'
       ,'Keeping of journal of pet behavior'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
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
       ('306'
       ,'1'
       ,'1'
       ,'1'
       ,'Affection and attention'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('307'
       ,'1'
       ,'1'
       ,'1'
       ,'Bathing'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('308'
       ,'1'
       ,'1'
       ,'1'
       ,'Off-leash walks'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('309'
       ,'1'
       ,'1'
       ,'1'
       ,'Safe, well-ventilated transportation to a park/beach'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('310'
       ,'1'
       ,'1'
       ,'1'
       ,'Healthy treats'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('311'
       ,'1'
       ,'1'
       ,'1'
       ,'Biodegradable clean-up bags'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('312'
       ,'1'
       ,'1'
       ,'1'
       ,'Treats'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('313'
       ,'1'
       ,'1'
       ,'1'
       ,'Clean-up bags'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('314'
       ,'1'
       ,'1'
       ,'1'
       ,'Play groups with other dog(s)'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('315'
       ,'1'
       ,'1'
       ,'1'
       ,'Taxi from one location to another'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('316'
       ,'1'
       ,'1'
       ,'1'
       ,'On-leash walks'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('317'
       ,'1'
       ,'1'
       ,'1'
       ,'Office organization'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('318'
       ,'1'
       ,'1'
       ,'1'
       ,'Errand running'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('319'
       ,'1'
       ,'1'
       ,'1'
       ,'Waiting for service people'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('320'
       ,'1'
       ,'1'
       ,'1'
       ,'Heavy lifting'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('321'
       ,'1'
       ,'1'
       ,'1'
       ,'Packing'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('322'
       ,'1'
       ,'1'
       ,'1'
       ,'eBay selling help'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('323'
       ,'1'
       ,'1'
       ,'1'
       ,'Craigslist posting help'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('324'
       ,'1'
       ,'1'
       ,'1'
       ,'Data entry'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('325'
       ,'1'
       ,'1'
       ,'1'
       ,'IKEA furniture assembly'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('326'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery delivery'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('327'
       ,'1'
       ,'1'
       ,'1'
       ,'Retail store delivery'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('328'
       ,'1'
       ,'1'
       ,'1'
       ,'Donation pickup/drop-off'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('329'
       ,'1'
       ,'1'
       ,'1'
       ,'Junk removal'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('330'
       ,'1'
       ,'1'
       ,'1'
       ,'Computer help'
       ,'May include installing/updating software, anti-virus programs, and general tune-up.  For tutoring, please look for computer tutor.'
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('331'
       ,'1'
       ,'1'
       ,'1'
       ,'Shipping'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('332'
       ,'1'
       ,'1'
       ,'1'
       ,'Restaurant delivery'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('333'
       ,'1'
       ,'1'
       ,'1'
       ,'Courier'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('334'
       ,'1'
       ,'1'
       ,'1'
       ,'Dry-cleaning drop-off/pick-up'
       ,''
       ,'6/25/2012 12:00:00 AM'
       ,'6/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('335'
       ,'1'
       ,'1'
       ,'1'
       ,'Oxygen facials'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('336'
       ,'1'
       ,'1'
       ,'1'
       ,'Double-cleanse'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('337'
       ,'1'
       ,'1'
       ,'1'
       ,'Professional exfoliation'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('338'
       ,'1'
       ,'1'
       ,'1'
       ,'Mask application'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('339'
       ,'1'
       ,'1'
       ,'1'
       ,'Pressure point massage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('340'
       ,'1'
       ,'1'
       ,'1'
       ,'Aromatherapy massage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('341'
       ,'1'
       ,'1'
       ,'1'
       ,'Lymphatic massage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('342'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress-relief therapy'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('343'
       ,'1'
       ,'1'
       ,'1'
       ,'Toxin release'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('344'
       ,'1'
       ,'1'
       ,'1'
       ,'Extraction'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('345'
       ,'1'
       ,'1'
       ,'1'
       ,'Micro-current technology'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('346'
       ,'1'
       ,'1'
       ,'1'
       ,'Circulation improvement'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('347'
       ,'1'
       ,'1'
       ,'1'
       ,'Lymphatic drainage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('348'
       ,'1'
       ,'1'
       ,'1'
       ,'Facial massage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('349'
       ,'1'
       ,'1'
       ,'1'
       ,'Scalp massage'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('350'
       ,'1'
       ,'1'
       ,'1'
       ,'Photo facials'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('351'
       ,'1'
       ,'1'
       ,'1'
       ,'Skin resurfacing'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('352'
       ,'1'
       ,'1'
       ,'1'
       ,'Photodynamic therapy'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('353'
       ,'1'
       ,'1'
       ,'1'
       ,'Pixel skin resurfacing'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('354'
       ,'1'
       ,'1'
       ,'1'
       ,'Laser hair removal'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('355'
       ,'1'
       ,'1'
       ,'1'
       ,'Light therapy'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('356'
       ,'1'
       ,'1'
       ,'1'
       ,'Laser acne facial'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('357'
       ,'1'
       ,'1'
       ,'1'
       ,'Tatoo removal'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('358'
       ,'1'
       ,'1'
       ,'1'
       ,'Hair removal'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('359'
       ,'1'
       ,'1'
       ,'1'
       ,'BOTOX®'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('360'
       ,'1'
       ,'1'
       ,'1'
       ,'Dysport®'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('361'
       ,'1'
       ,'1'
       ,'1'
       ,'Restylane®'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('362'
       ,'1'
       ,'1'
       ,'1'
       ,'Radiesse®'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('363'
       ,'1'
       ,'1'
       ,'1'
       ,'Perlane®'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('364'
       ,'1'
       ,'1'
       ,'1'
       ,'Juvéderm™'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('365'
       ,'1'
       ,'1'
       ,'1'
       ,'Injectable therapy'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('366'
       ,'1'
       ,'1'
       ,'1'
       ,'Microdermabrasion'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('367'
       ,'1'
       ,'1'
       ,'1'
       ,'Derma sweep'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('368'
       ,'1'
       ,'1'
       ,'1'
       ,'Hydra sweep'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('369'
       ,'1'
       ,'1'
       ,'1'
       ,'Dermaplaning'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('370'
       ,'1'
       ,'1'
       ,'1'
       ,'Clinical facials'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('371'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemical peels'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('372'
       ,'1'
       ,'1'
       ,'1'
       ,'Permanent makeup'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('373'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic treatments'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('374'
       ,'1'
       ,'1'
       ,'1'
       ,'Waxing'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('375'
       ,'1'
       ,'1'
       ,'1'
       ,'Skin conditions'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('376'
       ,'1'
       ,'1'
       ,'1'
       ,'Men''s skin care'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('377'
       ,'1'
       ,'1'
       ,'1'
       ,'Anti-aging'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('378'
       ,'1'
       ,'1'
       ,'1'
       ,'Hyperpigmentation'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('379'
       ,'1'
       ,'1'
       ,'1'
       ,'Laser treatments'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('380'
       ,'1'
       ,'1'
       ,'1'
       ,'Teen facials'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('381'
       ,'1'
       ,'1'
       ,'1'
       ,'Acne treatments'
       ,''
       ,'7/2/2012 12:00:00 AM'
       ,'7/2/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'179')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('382'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemistry'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('383'
       ,'1'
       ,'1'
       ,'1'
       ,'Calculus'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('384'
       ,'1'
       ,'1'
       ,'1'
       ,'Reading'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('385'
       ,'1'
       ,'1'
       ,'1'
       ,'Writing'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('386'
       ,'1'
       ,'1'
       ,'1'
       ,'Grammar'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('387'
       ,'1'
       ,'1'
       ,'1'
       ,'Elementary English'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('388'
       ,'1'
       ,'1'
       ,'1'
       ,'Social Studies'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('389'
       ,'1'
       ,'1'
       ,'1'
       ,'World history'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('390'
       ,'1'
       ,'1'
       ,'1'
       ,'US history'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('391'
       ,'1'
       ,'1'
       ,'1'
       ,'Early childhood education'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('392'
       ,'1'
       ,'1'
       ,'1'
       ,'Elementary science'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('393'
       ,'1'
       ,'1'
       ,'1'
       ,'English as second language (ESL)'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('394'
       ,'1'
       ,'1'
       ,'1'
       ,'Test preparation'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('395'
       ,'1'
       ,'1'
       ,'1'
       ,'College preparation'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('396'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('397'
       ,'1'
       ,'1'
       ,'1'
       ,'Elementary education'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('398'
       ,'1'
       ,'1'
       ,'1'
       ,'High school education'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('399'
       ,'1'
       ,'1'
       ,'1'
       ,'Early childhood education'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('400'
       ,'1'
       ,'1'
       ,'1'
       ,'Study skills'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('401'
       ,'1'
       ,'1'
       ,'1'
       ,'Custom painting'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('402'
       ,'1'
       ,'1'
       ,'1'
       ,'Surface preparation'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('403'
       ,'1'
       ,'1'
       ,'1'
       ,'Epoxy coatings'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('404'
       ,'1'
       ,'1'
       ,'1'
       ,'Replacement of metal flashing'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('405'
       ,'1'
       ,'1'
       ,'1'
       ,'Victorin restoration'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('406'
       ,'1'
       ,'1'
       ,'1'
       ,'Deck cleaning'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('407'
       ,'1'
       ,'1'
       ,'1'
       ,'Deck sealing'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('408'
       ,'1'
       ,'1'
       ,'1'
       ,'Power washing'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('409'
       ,'1'
       ,'1'
       ,'1'
       ,'Stucco repairs'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('410'
       ,'1'
       ,'1'
       ,'1'
       ,'Window repairs'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('411'
       ,'1'
       ,'1'
       ,'1'
       ,'Waterproof elastomeric coatings'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('412'
       ,'1'
       ,'1'
       ,'1'
       ,'Lead-safe procedures'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('413'
       ,'1'
       ,'1'
       ,'1'
       ,'Color consulting'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('414'
       ,'1'
       ,'1'
       ,'1'
       ,'Dry rot repairs'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('415'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpentry'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('416'
       ,'1'
       ,'1'
       ,'1'
       ,'Custom finishes'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('417'
       ,'1'
       ,'1'
       ,'1'
       ,'Latex coatings'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('418'
       ,'1'
       ,'1'
       ,'1'
       ,'Oil coatings'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('419'
       ,'1'
       ,'1'
       ,'1'
       ,'Enamel coatings'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('420'
       ,'1'
       ,'1'
       ,'1'
       ,'Water-damage repair'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('421'
       ,'1'
       ,'1'
       ,'1'
       ,'Fire-damage repair'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('422'
       ,'1'
       ,'1'
       ,'1'
       ,'Sheet-rocking'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('423'
       ,'1'
       ,'1'
       ,'1'
       ,'Wallpaper removal'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('424'
       ,'1'
       ,'1'
       ,'1'
       ,'Cabinet refinishing'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('425'
       ,'1'
       ,'1'
       ,'1'
       ,'Spray finishes'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('426'
       ,'1'
       ,'1'
       ,'1'
       ,'Blanket wrapping protection'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('427'
       ,'1'
       ,'1'
       ,'1'
       ,'Wardrobe boxes'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('428'
       ,'1'
       ,'1'
       ,'1'
       ,'Dollies'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('429'
       ,'1'
       ,'1'
       ,'1'
       ,'Furniture disassembly'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('430'
       ,'1'
       ,'1'
       ,'1'
       ,'Furniture reassembly'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('431'
       ,'1'
       ,'1'
       ,'1'
       ,'Weekends'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('432'
       ,'1'
       ,'1'
       ,'1'
       ,'Stairs'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('433'
       ,'1'
       ,'1'
       ,'1'
       ,'Apartment'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('434'
       ,'1'
       ,'1'
       ,'1'
       ,'Residential'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('435'
       ,'1'
       ,'1'
       ,'1'
       ,'Commercial'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('436'
       ,'1'
       ,'1'
       ,'1'
       ,'Office'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('437'
       ,'1'
       ,'1'
       ,'1'
       ,'Double drive time'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('438'
       ,'1'
       ,'1'
       ,'1'
       ,'Fuel charge'
       ,''
       ,'7/5/2012 12:00:00 AM'
       ,'7/5/2012 12:00:00 AM'
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
       ('439'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('440'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('441'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('442'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('443'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpooling'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('444'
       ,'1'
       ,'1'
       ,'1'
       ,'Light housekeeping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('445'
       ,'1'
       ,'1'
       ,'1'
       ,'Homework help'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('446'
       ,'1'
       ,'1'
       ,'1'
       ,'Swimming supervision'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('447'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('448'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for multiple children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('449'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for twins/multiples'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('450'
       ,'1'
       ,'1'
       ,'1'
       ,'Comfortable with pets'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('451'
       ,'1'
       ,'1'
       ,'1'
       ,'Non-smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('452'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('453'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to care for sick children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('454'
       ,'1'
       ,'1'
       ,'1'
       ,'Meal preparation'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('455'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic and natural fertilizers'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('456'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic and natural pest control'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('457'
       ,'1'
       ,'1'
       ,'1'
       ,'CPR'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
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
       ('458'
       ,'1'
       ,'1'
       ,'1'
       ,'Infant first aid'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
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
       ('459'
       ,'1'
       ,'1'
       ,'1'
       ,'Infant CPR'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
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
       ('460'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to transport children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('461'
       ,'1'
       ,'1'
       ,'1'
       ,'Manage and administer medications'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('462'
       ,'1'
       ,'1'
       ,'1'
       ,'Transport to/from doctor visits'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('463'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('464'
       ,'1'
       ,'1'
       ,'1'
       ,'Housekeeping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('465'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('466'
       ,'1'
       ,'1'
       ,'1'
       ,'Bathing/transferring'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('467'
       ,'1'
       ,'1'
       ,'1'
       ,'Assist with walking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('468'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('469'
       ,'1'
       ,'1'
       ,'1'
       ,'Walks and activities'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('470'
       ,'1'
       ,'1'
       ,'1'
       ,'Eating/feeding assistance'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('471'
       ,'1'
       ,'1'
       ,'1'
       ,'Assistance with wheelchair'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('472'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('473'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('474'
       ,'1'
       ,'1'
       ,'1'
       ,'Alzheimer Disease'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('475'
       ,'1'
       ,'1'
       ,'1'
       ,'Parkinson''s Disease'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('476'
       ,'1'
       ,'1'
       ,'1'
       ,'Cancer'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('477'
       ,'1'
       ,'1'
       ,'1'
       ,'Dementia'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('478'
       ,'1'
       ,'1'
       ,'1'
       ,'Hospice'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('479'
       ,'1'
       ,'1'
       ,'1'
       ,'Surgery recovery'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('480'
       ,'1'
       ,'1'
       ,'1'
       ,'Catheter care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('481'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('482'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs adults'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('483'
       ,'1'
       ,'1'
       ,'1'
       ,'Full-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('484'
       ,'1'
       ,'1'
       ,'1'
       ,'Part-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('485'
       ,'1'
       ,'1'
       ,'1'
       ,'Live in'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('486'
       ,'1'
       ,'1'
       ,'1'
       ,'On call'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('487'
       ,'1'
       ,'1'
       ,'1'
       ,'Overnight'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('488'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal life coaching'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('489'
       ,'1'
       ,'1'
       ,'1'
       ,'Relationship counseling'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('490'
       ,'1'
       ,'1'
       ,'1'
       ,'Professional/Career planning and development'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('491'
       ,'1'
       ,'1'
       ,'1'
       ,'Business training'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('492'
       ,'1'
       ,'1'
       ,'1'
       ,'Health and aging'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('493'
       ,'1'
       ,'1'
       ,'1'
       ,'Lifestyle and self-Care'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('494'
       ,'1'
       ,'1'
       ,'1'
       ,'Family and parenting'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('495'
       ,'1'
       ,'1'
       ,'1'
       ,'Finances/Budgeting'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('496'
       ,'1'
       ,'1'
       ,'1'
       ,'Time management/Motivation'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('497'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress management and balance '
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('498'
       ,'1'
       ,'1'
       ,'1'
       ,'Spirituality and personal growth  '
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('499'
       ,'1'
       ,'1'
       ,'1'
       ,'Creativity for artists, writers, musicians and performers'
       ,''
       ,'7/12/2012 12:00:00 AM'
       ,'7/12/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'186')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('500'
       ,'1'
       ,'1'
       ,'1'
       ,'Lymphatic drainage '
       ,'Massage technique used to gently work and stimulate the lymphatic system, to assist in reduction of localised swelling.'
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('501'
       ,'1'
       ,'1'
       ,'1'
       ,'In-call'
       ,'An incall is a service done at the service provider''s location. '
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('502'
       ,'1'
       ,'1'
       ,'1'
       ,'Out-call'
       ,'An outcall is a service done at the client''s location.'
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('503'
       ,'1'
       ,'1'
       ,'1'
       ,'Abuse - Current'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('504'
       ,'1'
       ,'1'
       ,'1'
       ,'Abuse - Survivors'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('505'
       ,'1'
       ,'1'
       ,'1'
       ,'Addictions'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('506'
       ,'1'
       ,'1'
       ,'1'
       ,'Adolescents'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('507'
       ,'1'
       ,'1'
       ,'1'
       ,'Adoption Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('508'
       ,'1'
       ,'1'
       ,'1'
       ,'Adult Children of Alcoholics'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('509'
       ,'1'
       ,'1'
       ,'1'
       ,'AIDS/HIV/ARC'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('510'
       ,'1'
       ,'1'
       ,'1'
       ,'Anger Management'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('511'
       ,'1'
       ,'1'
       ,'1'
       ,'Anxiety/Phobias'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('512'
       ,'1'
       ,'1'
       ,'1'
       ,'Children'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('513'
       ,'1'
       ,'1'
       ,'1'
       ,'Chronic/Life-threatening Illness'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('514'
       ,'1'
       ,'1'
       ,'1'
       ,'Coaching'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('515'
       ,'1'
       ,'1'
       ,'1'
       ,'Communication Skills'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('516'
       ,'1'
       ,'1'
       ,'1'
       ,'Couples Counseling'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('517'
       ,'1'
       ,'1'
       ,'1'
       ,'Creativity for Artists'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('518'
       ,'1'
       ,'1'
       ,'1'
       ,'Crisis Intervention'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('519'
       ,'1'
       ,'1'
       ,'1'
       ,'Cross-cultural Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('520'
       ,'1'
       ,'1'
       ,'1'
       ,'Depression'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('521'
       ,'1'
       ,'1'
       ,'1'
       ,'Disability'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('522'
       ,'1'
       ,'1'
       ,'1'
       ,'Dissociative Disorders'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('523'
       ,'1'
       ,'1'
       ,'1'
       ,'Divorce/Separation/Custody'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('524'
       ,'1'
       ,'1'
       ,'1'
       ,'Domestic Violence'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('525'
       ,'1'
       ,'1'
       ,'1'
       ,'Dual Diagnosis'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('526'
       ,'1'
       ,'1'
       ,'1'
       ,'Eating Disorders'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('527'
       ,'1'
       ,'1'
       ,'1'
       ,'Elder Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('528'
       ,'1'
       ,'1'
       ,'1'
       ,'Families'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('529'
       ,'1'
       ,'1'
       ,'1'
       ,'Forensic Consultation'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('530'
       ,'1'
       ,'1'
       ,'1'
       ,'Grief & Loss'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('531'
       ,'1'
       ,'1'
       ,'1'
       ,'Learning Disabilities'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('532'
       ,'1'
       ,'1'
       ,'1'
       ,'LGBTQI'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('533'
       ,'1'
       ,'1'
       ,'1'
       ,'Life Cycle Transition'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('534'
       ,'1'
       ,'1'
       ,'1'
       ,'Men''s Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('535'
       ,'1'
       ,'1'
       ,'1'
       ,'Menopause'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('536'
       ,'1'
       ,'1'
       ,'1'
       ,'Midlife Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('537'
       ,'1'
       ,'1'
       ,'1'
       ,'Mind/Body (Somatic)'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('538'
       ,'1'
       ,'1'
       ,'1'
       ,'Panic Attacks'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('539'
       ,'1'
       ,'1'
       ,'1'
       ,'Parenting'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('540'
       ,'1'
       ,'1'
       ,'1'
       ,'Personality Disorders'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('541'
       ,'1'
       ,'1'
       ,'1'
       ,'Posttraumatic Stress'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('542'
       ,'1'
       ,'1'
       ,'1'
       ,'Pregnancy/Childbirth'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('543'
       ,'1'
       ,'1'
       ,'1'
       ,'Relationships'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('544'
       ,'1'
       ,'1'
       ,'1'
       ,'School Problems'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('545'
       ,'1'
       ,'1'
       ,'1'
       ,'Self-esteem Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('546'
       ,'1'
       ,'1'
       ,'1'
       ,'Sex Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('547'
       ,'1'
       ,'1'
       ,'1'
       ,'Spirituality'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('548'
       ,'1'
       ,'1'
       ,'1'
       ,'Step/Blended Families'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('549'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress Management'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('550'
       ,'1'
       ,'1'
       ,'1'
       ,'Substance Abuse'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('551'
       ,'1'
       ,'1'
       ,'1'
       ,'Women''s Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('552'
       ,'1'
       ,'1'
       ,'1'
       ,'Work/Career Issues'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('553'
       ,'1'
       ,'1'
       ,'1'
       ,'AEDP'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('554'
       ,'1'
       ,'1'
       ,'1'
       ,'Behavior Modification'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('555'
       ,'1'
       ,'1'
       ,'1'
       ,'Body Oriented Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('556'
       ,'1'
       ,'1'
       ,'1'
       ,'Brief Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('557'
       ,'1'
       ,'1'
       ,'1'
       ,'Client Centered Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('558'
       ,'1'
       ,'1'
       ,'1'
       ,'Cognitive/Behavioral Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('559'
       ,'1'
       ,'1'
       ,'1'
       ,'Control-Mastery Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('560'
       ,'1'
       ,'1'
       ,'1'
       ,'Dialectical Behavioral Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('561'
       ,'1'
       ,'1'
       ,'1'
       ,'Drama Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('562'
       ,'1'
       ,'1'
       ,'1'
       ,'EMDR'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('563'
       ,'1'
       ,'1'
       ,'1'
       ,'Expressive Arts Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('564'
       ,'1'
       ,'1'
       ,'1'
       ,'Family Systems Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('565'
       ,'1'
       ,'1'
       ,'1'
       ,'Humanistic/Existential Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('566'
       ,'1'
       ,'1'
       ,'1'
       ,'Hypnotherapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('567'
       ,'1'
       ,'1'
       ,'1'
       ,'Imago Relationship Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('568'
       ,'1'
       ,'1'
       ,'1'
       ,'Integrative/Eclectic'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('569'
       ,'1'
       ,'1'
       ,'1'
       ,'Intersubjective'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('570'
       ,'1'
       ,'1'
       ,'1'
       ,'Jungian'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('571'
       ,'1'
       ,'1'
       ,'1'
       ,'Object Relations Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('572'
       ,'1'
       ,'1'
       ,'1'
       ,'Play Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('573'
       ,'1'
       ,'1'
       ,'1'
       ,'Psychoanalytic Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('574'
       ,'1'
       ,'1'
       ,'1'
       ,'Psychodynamic Therapy'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('575'
       ,'1'
       ,'1'
       ,'1'
       ,'Sand Play'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('576'
       ,'1'
       ,'1'
       ,'1'
       ,'Self Psychology'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('577'
       ,'1'
       ,'1'
       ,'1'
       ,'Spiritual/Religious'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('578'
       ,'1'
       ,'1'
       ,'1'
       ,'Transpersonal'
       ,''
       ,'7/13/2012 12:00:00 AM'
       ,'7/13/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('681'
       ,'1'
       ,'1'
       ,'1'
       ,'Homeschooling'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('682'
       ,'1'
       ,'1'
       ,'1'
       ,'TOEFL'
       ,'The TOEFL iBT test measures your ability to use and understand English at the university level. And it evaluates how well you combine your listening, reading, speaking and writing skills to perform academic tasks.  There are two formats for the TOEFL test. The format you take depends on the location of your test center. Most test takers take the TOEFL iBT test. Test centers that do not have Internet access offer the Paper-based Test (PBT).'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('683'
       ,'1'
       ,'1'
       ,'1'
       ,'Elderly'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('684'
       ,'1'
       ,'1'
       ,'1'
       ,'Adult Education'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('685'
       ,'1'
       ,'1'
       ,'1'
       ,'ACT Math'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('686'
       ,'1'
       ,'1'
       ,'1'
       ,'ACT Science'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('687'
       ,'1'
       ,'1'
       ,'1'
       ,'ACT Reading'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('688'
       ,'1'
       ,'1'
       ,'1'
       ,'ACT English'
       ,'ACT, Inc. says that the ACT assessment measures high school students'''' general educational development and their capability to complete college-level work with the multiple choice tests covering four skill areas: English, mathematics, reading, and science. The optional Writing Test measures skill in planning and writing a short essay. Specifically, ACT states that its scores provide an indicator of "college readiness", and that scores in each of the subtests correspond to skills in entry-level college courses in English, algebra, social science, humanities, and biology.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('689'
       ,'1'
       ,'1'
       ,'1'
       ,'SAT Math'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('690'
       ,'1'
       ,'1'
       ,'1'
       ,'SAT Science'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('691'
       ,'1'
       ,'1'
       ,'1'
       ,'SAT Reading'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('692'
       ,'1'
       ,'1'
       ,'1'
       ,'SAT English'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('693'
       ,'1'
       ,'1'
       ,'1'
       ,'GRE Writing'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section,while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('694'
       ,'1'
       ,'1'
       ,'1'
       ,'GRE Verbal'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section,while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('695'
       ,'1'
       ,'1'
       ,'1'
       ,'GRE Quantitative'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section,while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('696'
       ,'1'
       ,'1'
       ,'1'
       ,'GRE Experimental'
       ,'The Graduate Record Examinations (GRE) is a standardized test that is an admissions requirement for many graduate schools in the United States, in other English-speaking countries and for English-taught graduate and business programs world-wide.  The exam consists of four sections. The first section is a writing section,while the other three are multiple-choice style. One of the multiple choice style exams will test verbal skills, another will test quantitative skills and a third exam will be an experimental section that is not included in the reported score. The entire test procedure takes about 4 hours.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('697'
       ,'1'
       ,'1'
       ,'1'
       ,'GMAT Verbal'
       ,'The Graduate Management Admission Test (GMAT) is a computer-adaptive standardized test in mathematics and the English language for measuring aptitude to succeed academically in graduate business studies.  The exam measures verbal, mathematical, and analytical writing skills that the examinee has developed over a long period of time in his or her education and work. Test takers answer questions in each of the three tested areas, and there are also two optional breaks; in general, the test takes about four hours to complete.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('698'
       ,'1'
       ,'1'
       ,'1'
       ,'GMAT Quantitative'
       ,'The Graduate Management Admission Test (GMAT) is a computer-adaptive standardized test in mathematics and the English language for measuring aptitude to succeed academically in graduate business studies.  The exam measures verbal, mathematical, and analytical writing skills that the examinee has developed over a long period of time in his or her education and work. Test takers answer questions in each of the three tested areas, and there are also two optional breaks; in general, the test takes about four hours to complete.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('699'
       ,'1'
       ,'1'
       ,'1'
       ,'LSAT Reading'
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('700'
       ,'1'
       ,'1'
       ,'1'
       ,'LSAT Verbal'
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('701'
       ,'1'
       ,'1'
       ,'1'
       ,'LSAT Logic'
       ,'The Law School Admission Test (LSAT) is an examination in the United States, Canada (common law programs only), and Australia administered by the Law School Admission Council (LSAC) for prospective law school candidates. It is designed to assess Reading Comprehension, logical, and verbal reasoning proficiencies. Administered four times a year, it is a required exam for all ABA-approved law schools. An applicant cannot take the LSAT more than three times within a two-year period.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('702'
       ,'1'
       ,'1'
       ,'1'
       ,'PSAT'
       ,'The College Board states that the SAT measures literacy and writing skills that are needed for academic success in college. They state that the SAT assesses how well the testtakers analyze and solve problems using skills they learned in school that they will need in college. The SAT is typically taken by high school sophomores, juniors and seniors. Specifically, the College Board states that use of the SAT in combination with high school grade point average (GPA) provides a better indicator of success in college than high school grades alone, as measured by college freshman GPA. Various studies conducted over the lifetime of the SAT show a statistically significant increase in correlation of high school grades and freshman grades when the SAT is factored in.'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('703'
       ,'1'
       ,'1'
       ,'1'
       ,'ISEE'
       ,'The ISEE is an admission test that has three levels:  A Lower Level, Middle Level, and Upper Level.  The Lower Level is for students currently in grades 4 and 5 who are candidates for admission to grades 5 and 6.  The Middle Level is for students in grades 6 and 7 who are candidates for grades 7 and 8.  The Upper Level is for students in grades 8 through 11 who are candidates for grades 9 through 12.  The ISEE has different forms at each level for security purposes.
At all levels, the ISEE consists of three parts: (a) carefully constructed and standardized verbal and quantitative reasoning tests that measure a student''s capability for learning; (b) reading comprehension and mathematics achievement tests that provide specific information about a student''s strengths and weakness in those areas; and (c) an essay section.
The ISEE essay is timed and written in response to a prompt.  The essay is not scored; it is photocopied and sent only to the schools you requested.
'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('704'
       ,'1'
       ,'1'
       ,'1'
       ,'CBEST'
       ,'The California Basic Educational Skills Test™ (CBEST®) was developed to meet requirements of laws relating to credentialing and employment. This test requirement does not replace any of the other requirements of subject matter knowledge, professional preparation, and practice teaching or field experience applicable to the issuance of credentials. The CBEST is designed to test basic reading, mathematics, and writing skills found to be important for the job of an educator; the test is not designed to measure the ability to teach those skills. The California legislation that established the CBEST directed the State Superintendent of Public Instruction, in conjunction with the Commission on Teacher Credentialing (CTC) and an Advisory Board consisting of a majority of educators from California classrooms, to develop the CBEST. The development of the CBEST included definition of the primary skills to be tested; test-item writing and review for relevance to the specified skill areas; field testing; a validity study focusing on the accuracy, fairness, clarity, and job relevance of each test item; bias reviews; standard-setting studies; and determination of the passing scores. Since the initial development of the CBEST, new test items have been developed by contractors and all items have been reviewed by committees of California educators to verify that they meet test specifications adopted by the CTC and are free of bias. '
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('705'
       ,'1'
       ,'1'
       ,'1'
       ,'GED'
       ,'The current test series is the 2002 Series GED Test—the fourth test series developed by GED Testing Service. The test is available in English, Spanish, and French and covers the academic areas of a high school education: Language Arts, Reading, Writing, Mathematics, Science, Social Studies
A high school diploma remains the primary ticket to many entry-level jobs, and is also a prerequisite for promotions, occupational training, and postsecondary education. In an ideal society, everyone would graduate from high school. Although that is not a reality today, GED Testing Service offers the only nationally recognized opportunity to earn a high school-equivalency credential.
The 2002 Series GED Test is delivered in two formats:  paper and computer.
Pencil-and-paper testing is delivered in a testing center using a test booklet and answer sheet
Testing on computer is delivered in a testing center on a computer, and requires basic computer skills
Both delivery methods use the same 2002 Series GED Test. This test will be in use until the new assessment is released in 2014.
'
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('706'
       ,'1'
       ,'1'
       ,'1'
       ,'Yoga'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('707'
       ,'1'
       ,'1'
       ,'1'
       ,'Lower back pain prevention/postrehab'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('708'
       ,'1'
       ,'1'
       ,'1'
       ,'Wellness/preventative fitness'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('709'
       ,'1'
       ,'1'
       ,'1'
       ,'Goal(s) assessment'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('710'
       ,'1'
       ,'1'
       ,'1'
       ,'Body composition testing'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('711'
       ,'1'
       ,'1'
       ,'1'
       ,'Movement assessment'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('712'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutrition assessment'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('713'
       ,'1'
       ,'1'
       ,'1'
       ,'Workout planning'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('714'
       ,'1'
       ,'1'
       ,'1'
       ,'Customized program design'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('715'
       ,'1'
       ,'1'
       ,'1'
       ,'Lifestyle evaluation'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('716'
       ,'1'
       ,'1'
       ,'1'
       ,'Behavior management consultation'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('717'
       ,'1'
       ,'1'
       ,'1'
       ,'Meal planning'
       ,''
       ,'9/18/2012 12:00:00 AM'
       ,'9/18/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('718'
       ,'1'
       ,'1'
       ,'1'
       ,'Collar'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('719'
       ,'1'
       ,'1'
       ,'1'
       ,'Leash'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('720'
       ,'1'
       ,'1'
       ,'1'
       ,'Reinforcer/clicker'
       ,'Allows the Dog Walker to promote good behavior '
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('721'
       ,'1'
       ,'1'
       ,'1'
       ,'Toys'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('722'
       ,'1'
       ,'1'
       ,'1'
       ,'Status report cards'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('723'
       ,'1'
       ,'1'
       ,'1'
       ,'SMS updates'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('724'
       ,'1'
       ,'1'
       ,'1'
       ,'Phone call updates'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('726'
       ,'1'
       ,'1'
       ,'1'
       ,'Harness'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('727'
       ,'1'
       ,'1'
       ,'1'
       ,'Muzzle'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('728'
       ,'1'
       ,'1'
       ,'1'
       ,'Small dogs'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('729'
       ,'1'
       ,'1'
       ,'1'
       ,'Medium dogs'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('730'
       ,'1'
       ,'1'
       ,'1'
       ,'Large dogs'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('731'
       ,'1'
       ,'1'
       ,'1'
       ,'Watering'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'76')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('732'
       ,'1'
       ,'1'
       ,'1'
       ,'Pain relief'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('733'
       ,'1'
       ,'1'
       ,'1'
       ,'Physical therapy'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('734'
       ,'1'
       ,'1'
       ,'1'
       ,'Toxin release'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('735'
       ,'1'
       ,'1'
       ,'1'
       ,'Increased circulation'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('736'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress relief'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('737'
       ,'1'
       ,'1'
       ,'1'
       ,'Relaxation'
       ,''
       ,'9/20/2012 12:00:00 AM'
       ,'9/20/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('738'
       ,'1'
       ,'1'
       ,'1'
       ,'Weightlifting'
       ,NULL
       ,'9/24/2012 12:00:00 AM'
       ,'9/24/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('739'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight gain'
       ,NULL
       ,'9/24/2012 12:00:00 AM'
       ,'9/24/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('740'
       ,'1'
       ,'1'
       ,'1'
       ,'Home program design'
       ,NULL
       ,'9/24/2012 12:00:00 AM'
       ,'9/24/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'61')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('741'
       ,'1'
       ,'1'
       ,'1'
       ,'Study materials'
       ,NULL
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('742'
       ,'1'
       ,'1'
       ,'1'
       ,'Study materials'
       ,NULL
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('743'
       ,'1'
       ,'1'
       ,'1'
       ,'Overnights'
       ,NULL
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'16')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('744'
       ,'1'
       ,'1'
       ,'1'
       ,'Full-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('745'
       ,'1'
       ,'1'
       ,'1'
       ,'Part-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('746'
       ,'1'
       ,'1'
       ,'1'
       ,'Live in'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('747'
       ,'1'
       ,'1'
       ,'1'
       ,'On call'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('748'
       ,'1'
       ,'1'
       ,'1'
       ,'Overnight'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('749'
       ,'1'
       ,'1'
       ,'1'
       ,'Full-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('750'
       ,'1'
       ,'1'
       ,'1'
       ,'Part-time'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('751'
       ,'1'
       ,'1'
       ,'1'
       ,'Live in'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('752'
       ,'1'
       ,'1'
       ,'1'
       ,'On call'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('753'
       ,'1'
       ,'1'
       ,'1'
       ,'Overnight'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('754'
       ,'1'
       ,'1'
       ,'1'
       ,'Infants'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('755'
       ,'1'
       ,'1'
       ,'1'
       ,'Toddlers'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('756'
       ,'1'
       ,'1'
       ,'1'
       ,'4-6 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('757'
       ,'1'
       ,'1'
       ,'1'
       ,'6-10 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('758'
       ,'1'
       ,'1'
       ,'1'
       ,'11-15 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('759'
       ,'1'
       ,'1'
       ,'1'
       ,'Infants'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('760'
       ,'1'
       ,'1'
       ,'1'
       ,'Toddlers'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('761'
       ,'1'
       ,'1'
       ,'1'
       ,'4-6 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('762'
       ,'1'
       ,'1'
       ,'1'
       ,'6-10 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('763'
       ,'1'
       ,'1'
       ,'1'
       ,'11-15 years'
       ,''
       ,'9/25/2012 12:00:00 AM'
       ,'9/25/2012 12:00:00 AM'
       ,NULL
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('764'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('765'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for multiple children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('766'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for twins/multiples'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('767'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('768'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for multiple children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('769'
       ,'1'
       ,'1'
       ,'1'
       ,'Care for twins/multiples'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('770'
       ,'1'
       ,'1'
       ,'1'
       ,'Comfortable with pets'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('771'
       ,'1'
       ,'1'
       ,'1'
       ,'Non-smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('772'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('773'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to care for sick children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('774'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to transport children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('775'
       ,'1'
       ,'1'
       ,'1'
       ,'Comfortable with pets'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('776'
       ,'1'
       ,'1'
       ,'1'
       ,'Non-smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('777'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoker'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('778'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to care for sick children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('779'
       ,'1'
       ,'1'
       ,'1'
       ,'Willing to transport children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('780'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('781'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('782'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('783'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('784'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpooling'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('785'
       ,'1'
       ,'1'
       ,'1'
       ,'Light housekeeping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('786'
       ,'1'
       ,'1'
       ,'1'
       ,'Homework help'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('787'
       ,'1'
       ,'1'
       ,'1'
       ,'Swimming supervision'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('788'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('789'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('790'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('791'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('792'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpooling'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('793'
       ,'1'
       ,'1'
       ,'1'
       ,'Light housekeeping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('794'
       ,'1'
       ,'1'
       ,'1'
       ,'Homework help'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('795'
       ,'1'
       ,'1'
       ,'1'
       ,'Swimming supervision'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('796'
       ,'1'
       ,'1'
       ,'1'
       ,'Meal preparation'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'17')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('797'
       ,'1'
       ,'1'
       ,'1'
       ,'Meal preparation'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'18')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('798'
       ,'1'
       ,'1'
       ,'1'
       ,'Manage and administer medications'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('799'
       ,'1'
       ,'1'
       ,'1'
       ,'Transport to/from doctor visits'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('800'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('801'
       ,'1'
       ,'1'
       ,'1'
       ,'Housekeeping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('802'
       ,'1'
       ,'1'
       ,'1'
       ,'Laundry'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('803'
       ,'1'
       ,'1'
       ,'1'
       ,'Bathing/transferring'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('804'
       ,'1'
       ,'1'
       ,'1'
       ,'Assist with walking'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('805'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('806'
       ,'1'
       ,'1'
       ,'1'
       ,'Walks and activities'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('807'
       ,'1'
       ,'1'
       ,'1'
       ,'Eating/feeding assistance'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('808'
       ,'1'
       ,'1'
       ,'1'
       ,'Assistance with wheelchair'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('809'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('810'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('811'
       ,'1'
       ,'1'
       ,'1'
       ,'Alzheimer Disease'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('812'
       ,'1'
       ,'1'
       ,'1'
       ,'Parkinson''s Disease'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('813'
       ,'1'
       ,'1'
       ,'1'
       ,'Cancer'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('814'
       ,'1'
       ,'1'
       ,'1'
       ,'Dementia'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('815'
       ,'1'
       ,'1'
       ,'1'
       ,'Hospice'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('816'
       ,'1'
       ,'1'
       ,'1'
       ,'Surgery recovery'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('817'
       ,'1'
       ,'1'
       ,'1'
       ,'Catheter care'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('818'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs children'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('819'
       ,'1'
       ,'1'
       ,'1'
       ,'Special needs adults'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'28')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('820'
       ,'1'
       ,'1'
       ,'1'
       ,'Residential'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('821'
       ,'1'
       ,'1'
       ,'1'
       ,'Commercial'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('822'
       ,'1'
       ,'1'
       ,'1'
       ,'Residential'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('823'
       ,'1'
       ,'1'
       ,'1'
       ,'Commercial'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'267')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('824'
       ,'1'
       ,'1'
       ,'1'
       ,'Full color short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('825'
       ,'1'
       ,'1'
       ,'1'
       ,'Full color long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('826'
       ,'1'
       ,'1'
       ,'1'
       ,'Full highlight short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('827'
       ,'1'
       ,'1'
       ,'1'
       ,'Full highlight long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('828'
       ,'1'
       ,'1'
       ,'1'
       ,'Partial highlight short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('829'
       ,'1'
       ,'1'
       ,'1'
       ,'Partial highlight long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('830'
       ,'1'
       ,'1'
       ,'1'
       ,'Color correction short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('831'
       ,'1'
       ,'1'
       ,'1'
       ,'Color correction long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('832'
       ,'1'
       ,'1'
       ,'1'
       ,'Color touch-up short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('833'
       ,'1'
       ,'1'
       ,'1'
       ,'Color touch-up long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('834'
       ,'1'
       ,'1'
       ,'1'
       ,'Tint short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('835'
       ,'1'
       ,'1'
       ,'1'
       ,'Tint long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('836'
       ,'1'
       ,'1'
       ,'1'
       ,'Partial balayage short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('837'
       ,'1'
       ,'1'
       ,'1'
       ,'Partial balayage long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('838'
       ,'1'
       ,'1'
       ,'1'
       ,'Full balayage short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('839'
       ,'1'
       ,'1'
       ,'1'
       ,'Full balayage long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('840'
       ,'1'
       ,'1'
       ,'1'
       ,'Keratin treatment short hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('841'
       ,'1'
       ,'1'
       ,'1'
       ,'Keratin treatment long hair'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('842'
       ,'1'
       ,'1'
       ,'1'
       ,'Eyebrow wax/shape'
       ,''
       ,'9/26/2012 12:00:00 AM'
       ,'9/26/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('843'
       ,'1'
       ,'1'
       ,'1'
       ,'Weeding'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('844'
       ,'1'
       ,'1'
       ,'1'
       ,'Edging'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('845'
       ,'1'
       ,'1'
       ,'1'
       ,'Edging'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('846'
       ,'1'
       ,'1'
       ,'1'
       ,'Raking'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('847'
       ,'1'
       ,'1'
       ,'1'
       ,'Fertilizing'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('848'
       ,'1'
       ,'1'
       ,'1'
       ,'Composting'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('849'
       ,'1'
       ,'1'
       ,'1'
       ,'Mulching'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('850'
       ,'1'
       ,'1'
       ,'1'
       ,'Pest control'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('851'
       ,'1'
       ,'1'
       ,'1'
       ,'Tree trimming'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('852'
       ,'1'
       ,'1'
       ,'1'
       ,'Bush trimming'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('853'
       ,'1'
       ,'1'
       ,'1'
       ,'Irrigation'
       ,NULL
       ,'7/10/2011 12:00:00 AM'
       ,'7/10/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('854'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic and natural fertilizers'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('855'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic and natural pest control'
       ,''
       ,'7/6/2012 12:00:00 AM'
       ,'7/6/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'23')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('856'
       ,'1'
       ,'1'
       ,'1'
       ,'Engine Repair'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('857'
       ,'1'
       ,'1'
       ,'1'
       ,'Automatic Transmission/Transaxle'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('858'
       ,'1'
       ,'1'
       ,'1'
       ,'Manual Drive Train & Axles'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('859'
       ,'1'
       ,'1'
       ,'1'
       ,'Suspension & Steering'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('860'
       ,'1'
       ,'1'
       ,'1'
       ,'Brakes'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('861'
       ,'1'
       ,'1'
       ,'1'
       ,'Electrical/Electronic Systems'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('862'
       ,'1'
       ,'1'
       ,'1'
       ,'Heating & Air Conditioning'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('863'
       ,'1'
       ,'1'
       ,'1'
       ,'Engine Performance'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('864'
       ,'1'
       ,'1'
       ,'1'
       ,'Light Vehicle Diesel Engines'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('865'
       ,'1'
       ,'1'
       ,'1'
       ,'Exhaust Systems'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('866'
       ,'1'
       ,'1'
       ,'1'
       ,'Lamp Adjustment'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('867'
       ,'1'
       ,'1'
       ,'1'
       ,'General Maintenance'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('868'
       ,'1'
       ,'1'
       ,'1'
       ,'Structural Analysis & Damage Repair'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'87')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('869'
       ,'1'
       ,'1'
       ,'1'
       ,'Mechanical & Electrical Components'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'87')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('870'
       ,'1'
       ,'1'
       ,'1'
       ,'Damage Analysis & Estimating'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'87')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('871'
       ,'1'
       ,'1'
       ,'1'
       ,'Painting & Refinishing'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'87')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('872'
       ,'1'
       ,'1'
       ,'1'
       ,'Non-Structural Analysis & Damage Repair'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'87')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('873'
       ,'1'
       ,'1'
       ,'1'
       ,'Acura'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('874'
       ,'1'
       ,'1'
       ,'1'
       ,'Audi'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('875'
       ,'1'
       ,'1'
       ,'1'
       ,'BMW'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('876'
       ,'1'
       ,'1'
       ,'1'
       ,'Buick'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('877'
       ,'1'
       ,'1'
       ,'1'
       ,'Cadillac'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('878'
       ,'1'
       ,'1'
       ,'1'
       ,'Chevrolet'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('879'
       ,'1'
       ,'1'
       ,'1'
       ,'Chrysler'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('880'
       ,'1'
       ,'1'
       ,'1'
       ,'Dodge'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('881'
       ,'1'
       ,'1'
       ,'1'
       ,'Eagle'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('882'
       ,'1'
       ,'1'
       ,'1'
       ,'Ferrari'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('883'
       ,'1'
       ,'1'
       ,'1'
       ,'Ford'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('884'
       ,'1'
       ,'1'
       ,'1'
       ,'GMC'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('885'
       ,'1'
       ,'1'
       ,'1'
       ,'Honda'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('886'
       ,'1'
       ,'1'
       ,'1'
       ,'Hummer'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('887'
       ,'1'
       ,'1'
       ,'1'
       ,'Hyundai'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('888'
       ,'1'
       ,'1'
       ,'1'
       ,'Infiniti'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('889'
       ,'1'
       ,'1'
       ,'1'
       ,'Isuzu'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('890'
       ,'1'
       ,'1'
       ,'1'
       ,'Jaguar'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('891'
       ,'1'
       ,'1'
       ,'1'
       ,'Jeep'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('892'
       ,'1'
       ,'1'
       ,'1'
       ,'Kia'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('893'
       ,'1'
       ,'1'
       ,'1'
       ,'Lamborghini'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('894'
       ,'1'
       ,'1'
       ,'1'
       ,'Land Rover'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('895'
       ,'1'
       ,'1'
       ,'1'
       ,'Lexus'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('896'
       ,'1'
       ,'1'
       ,'1'
       ,'Lincoln'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('897'
       ,'1'
       ,'1'
       ,'1'
       ,'Lotus'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('898'
       ,'1'
       ,'1'
       ,'1'
       ,'Mazda'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('899'
       ,'1'
       ,'1'
       ,'1'
       ,'Mercedes-Benz'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('900'
       ,'1'
       ,'1'
       ,'1'
       ,'Mercury'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('901'
       ,'1'
       ,'1'
       ,'1'
       ,'Mitsubishi'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('902'
       ,'1'
       ,'1'
       ,'1'
       ,'Nissan'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('903'
       ,'1'
       ,'1'
       ,'1'
       ,'Oldsmobile'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('904'
       ,'1'
       ,'1'
       ,'1'
       ,'Peugeot'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('905'
       ,'1'
       ,'1'
       ,'1'
       ,'Pontiac'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('906'
       ,'1'
       ,'1'
       ,'1'
       ,'Porsche'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('907'
       ,'1'
       ,'1'
       ,'1'
       ,'Saab'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('908'
       ,'1'
       ,'1'
       ,'1'
       ,'Saturn'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('909'
       ,'1'
       ,'1'
       ,'1'
       ,'Subaru'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('910'
       ,'1'
       ,'1'
       ,'1'
       ,'Suzuki'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('911'
       ,'1'
       ,'1'
       ,'1'
       ,'Toyota'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('912'
       ,'1'
       ,'1'
       ,'1'
       ,'Volkswagen'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('913'
       ,'1'
       ,'1'
       ,'1'
       ,'Volvo'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('914'
       ,'1'
       ,'1'
       ,'1'
       ,'Brake fluid level check'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('915'
       ,'1'
       ,'1'
       ,'1'
       ,'Serpentine belt inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('916'
       ,'1'
       ,'1'
       ,'1'
       ,'Windshield wiper blade inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('917'
       ,'1'
       ,'1'
       ,'1'
       ,'Antifreeze/coolant level check'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('918'
       ,'1'
       ,'1'
       ,'1'
       ,'Engine air filtration system inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('919'
       ,'1'
       ,'1'
       ,'1'
       ,'Exterior lights inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('920'
       ,'1'
       ,'1'
       ,'1'
       ,'Chassis inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('921'
       ,'1'
       ,'1'
       ,'1'
       ,'Oil change'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('922'
       ,'1'
       ,'1'
       ,'1'
       ,'Oil filter replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('923'
       ,'1'
       ,'1'
       ,'1'
       ,'Tire pressure check'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('924'
       ,'1'
       ,'1'
       ,'1'
       ,'Transmission/transaxle fluid fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('925'
       ,'1'
       ,'1'
       ,'1'
       ,'Differential fluid fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('926'
       ,'1'
       ,'1'
       ,'1'
       ,'Transfer case fluid fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('927'
       ,'1'
       ,'1'
       ,'1'
       ,'Power steering fluid fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('928'
       ,'1'
       ,'1'
       ,'1'
       ,'Windshield washer fluid fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('929'
       ,'1'
       ,'1'
       ,'1'
       ,'Battery water fill'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('930'
       ,'1'
       ,'1'
       ,'1'
       ,'A/C compressor drive belt inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('931'
       ,'1'
       ,'1'
       ,'1'
       ,'A/C components inspection'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('932'
       ,'1'
       ,'1'
       ,'1'
       ,'A/C system refrigerant evacuation'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('933'
       ,'1'
       ,'1'
       ,'1'
       ,'A/C system vaccuum test'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('934'
       ,'1'
       ,'1'
       ,'1'
       ,'A/C system recharge with refrigerant'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('935'
       ,'1'
       ,'1'
       ,'1'
       ,'Engine air filter inspection/replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('936'
       ,'1'
       ,'1'
       ,'1'
       ,'Cabin air filter inspection/replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('937'
       ,'1'
       ,'1'
       ,'1'
       ,'Radiator antifreeze/coolant replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('938'
       ,'1'
       ,'1'
       ,'1'
       ,'Drivetrain differential fluid replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('939'
       ,'1'
       ,'1'
       ,'1'
       ,'Drivetrain transfer case fluid replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('940'
       ,'1'
       ,'1'
       ,'1'
       ,'Battery diagnostic test'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('941'
       ,'1'
       ,'1'
       ,'1'
       ,'Battery replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('942'
       ,'1'
       ,'1'
       ,'1'
       ,'Battery terminal cleaning'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('943'
       ,'1'
       ,'1'
       ,'1'
       ,'Battery terminal replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('944'
       ,'1'
       ,'1'
       ,'1'
       ,'Light bulb inspection'
       ,'includes turn signals, taillights, headlights, brake lights, marker lights, and backup lights'
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('945'
       ,'1'
       ,'1'
       ,'1'
       ,'Light bulb replacement'
       ,'includes turn signals, taillights, headlights, brake lights, marker lights, and backup lights'
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('946'
       ,'1'
       ,'1'
       ,'1'
       ,'Serpentine belt replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('947'
       ,'1'
       ,'1'
       ,'1'
       ,'Fuel system cleaning'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('948'
       ,'1'
       ,'1'
       ,'1'
       ,'Tire rotation'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('949'
       ,'1'
       ,'1'
       ,'1'
       ,'Transmission fluid replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('950'
       ,'1'
       ,'1'
       ,'1'
       ,'Transmission filter replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('951'
       ,'1'
       ,'1'
       ,'1'
       ,'Windshield wiper blade replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('952'
       ,'1'
       ,'1'
       ,'1'
       ,'Windshield repair'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('953'
       ,'1'
       ,'1'
       ,'1'
       ,'Windshield replacement'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('954'
       ,'1'
       ,'1'
       ,'1'
       ,'Emissions/Smog check'
       ,''
       ,'10/9/2012 12:00:00 AM'
       ,'10/9/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'29')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('955'
       ,'1'
       ,'1'
       ,'1'
       ,'TOEIC'
       ,'TOEIC test scores provide accurate, reliable measurement of English proficiency — they can be compared regardless of where or when the test is administered. For example, last year''s scores of a test taker in Japan can be compared with this year''s scores of a test taker in Korea. Because test takers of any background can be compared fairly, companies can use the TOEIC tests to make the most informed decisions and build a more diverse workforce.'
       ,'12/3/2012 12:00:00 AM'
       ,'12/3/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('956'
       ,'1'
       ,'1'
       ,'1'
       ,'IELTS'
       ,'IELTS is the International English Language Testing System which tests English proficiency across the globe. IELTS tests are held in over 800 centres with tests up to four times a month. IELTS respects international diversity and is fair to anyone who sits the test, regardless of nationality ...'
       ,'12/3/2012 12:00:00 AM'
       ,'12/3/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'32')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('957'
       ,'1'
       ,'1'
       ,'1'
       ,'Small dogs'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('958'
       ,'1'
       ,'1'
       ,'1'
       ,'Medium dogs'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('959'
       ,'1'
       ,'1'
       ,'1'
       ,'Large dogs'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('960'
       ,'1'
       ,'1'
       ,'1'
       ,'Cats'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('961'
       ,'1'
       ,'1'
       ,'1'
       ,'Reptiles'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('962'
       ,'1'
       ,'1'
       ,'1'
       ,'Fish'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('963'
       ,'1'
       ,'1'
       ,'1'
       ,'Birds'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('964'
       ,'1'
       ,'1'
       ,'1'
       ,'Turtles'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('965'
       ,'1'
       ,'1'
       ,'1'
       ,'Hamsters'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('966'
       ,'1'
       ,'1'
       ,'1'
       ,'Rabbits'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('967'
       ,'1'
       ,'1'
       ,'1'
       ,'Basic grooming'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('968'
       ,'1'
       ,'1'
       ,'1'
       ,'Feeding'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('969'
       ,'1'
       ,'1'
       ,'1'
       ,'Administering medication'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('970'
       ,'1'
       ,'1'
       ,'1'
       ,'Affection and attention'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('980'
       ,'1'
       ,'1'
       ,'1'
       ,'Bathing'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('981'
       ,'1'
       ,'1'
       ,'1'
       ,'Off-leash walks'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('982'
       ,'1'
       ,'1'
       ,'1'
       ,'Safe, well-ventilated transportation to a park/beach'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('983'
       ,'1'
       ,'1'
       ,'1'
       ,'Healthy treats'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('984'
       ,'1'
       ,'1'
       ,'1'
       ,'Biodegradable clean-up bags'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('985'
       ,'1'
       ,'1'
       ,'1'
       ,'Treats'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('986'
       ,'1'
       ,'1'
       ,'1'
       ,'Clean-up bags'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('987'
       ,'1'
       ,'1'
       ,'1'
       ,'Play groups with other dog(s)'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('988'
       ,'1'
       ,'1'
       ,'1'
       ,'Taxi from one location to another'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('989'
       ,'1'
       ,'1'
       ,'1'
       ,'On-leash walks'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('990'
       ,'1'
       ,'1'
       ,'1'
       ,'Collar'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('991'
       ,'1'
       ,'1'
       ,'1'
       ,'Leash'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('992'
       ,'1'
       ,'1'
       ,'1'
       ,'Reinforcer/clicker'
       ,'Allows the Dog Walker to promote good behavior '
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('993'
       ,'1'
       ,'1'
       ,'1'
       ,'Toys'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('994'
       ,'1'
       ,'1'
       ,'1'
       ,'Status report cards'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('995'
       ,'1'
       ,'1'
       ,'1'
       ,'SMS updates'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('996'
       ,'1'
       ,'1'
       ,'1'
       ,'Phone call updates'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('997'
       ,'1'
       ,'1'
       ,'1'
       ,'Harness'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('998'
       ,'1'
       ,'1'
       ,'1'
       ,'Muzzle'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('999'
       ,'1'
       ,'1'
       ,'1'
       ,'Watering'
       ,''
       ,'12/10/2012 12:00:00 AM'
       ,'12/10/2012 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'78')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1000'
       ,'1'
       ,'1'
       ,'1'
       ,'Koehler method'
       ,'http://en.wikipedia.org/wiki/Dog_training#The_Koehler_method'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1001'
       ,'1'
       ,'1'
       ,'1'
       ,'Motivational training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Motivational_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1002'
       ,'1'
       ,'1'
       ,'1'
       ,'Clicker training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Clicker_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1003'
       ,'1'
       ,'1'
       ,'1'
       ,'Electronic training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Electronic_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1004'
       ,'1'
       ,'1'
       ,'1'
       ,'Model-rival training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Model-rival_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1005'
       ,'1'
       ,'1'
       ,'1'
       ,'Dominance-based training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Dominance-based_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1006'
       ,'1'
       ,'1'
       ,'1'
       ,'Relationship-based training'
       ,'http://en.wikipedia.org/wiki/Dog_training#Relationship-based_training'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1007'
       ,'1'
       ,'1'
       ,'1'
       ,'Puppy training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1008'
       ,'1'
       ,'1'
       ,'1'
       ,'Basic commands'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1009'
       ,'1'
       ,'1'
       ,'1'
       ,'Obedience'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1010'
       ,'1'
       ,'1'
       ,'1'
       ,'Housebreaking'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1011'
       ,'1'
       ,'1'
       ,'1'
       ,'Off-leash training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1012'
       ,'1'
       ,'1'
       ,'1'
       ,'Behavior problems'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1013'
       ,'1'
       ,'1'
       ,'1'
       ,'Aggression issues'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1014'
       ,'1'
       ,'1'
       ,'1'
       ,'AKC Canine Good Citizen Test'
       ,'http://en.wikipedia.org/wiki/Canine_Good_Citizen'
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1015'
       ,'1'
       ,'1'
       ,'1'
       ,'Hunting/Sports training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1016'
       ,'1'
       ,'1'
       ,'1'
       ,'Odor training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1017'
       ,'1'
       ,'1'
       ,'1'
       ,'Assitance training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1018'
       ,'1'
       ,'1'
       ,'1'
       ,'Disabilities training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1019'
       ,'1'
       ,'1'
       ,'1'
       ,'Cat friendly training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1020'
       ,'1'
       ,'1'
       ,'1'
       ,'Guard training'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1021'
       ,'1'
       ,'1'
       ,'1'
       ,'Puppies'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1022'
       ,'1'
       ,'1'
       ,'1'
       ,'1-2 years old'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1023'
       ,'1'
       ,'1'
       ,'1'
       ,'3-5 years old'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1024'
       ,'1'
       ,'1'
       ,'1'
       ,'6+ years old'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1025'
       ,'1'
       ,'1'
       ,'1'
       ,'Small dogs'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1026'
       ,'1'
       ,'1'
       ,'1'
       ,'Medium dogs'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1027'
       ,'1'
       ,'1'
       ,'1'
       ,'Large dogs'
       ,''
       ,'1/5/2013 12:00:00 AM'
       ,'1/5/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'271')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1028'
       ,'1'
       ,'1'
       ,'1'
       ,'Modeling'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1029'
       ,'1'
       ,'1'
       ,'1'
       ,'Engagement'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1030'
       ,'1'
       ,'1'
       ,'1'
       ,'Family'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1031'
       ,'1'
       ,'1'
       ,'1'
       ,'Special Occasions'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1032'
       ,'1'
       ,'1'
       ,'1'
       ,'DVD/CD'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1033'
       ,'1'
       ,'1'
       ,'1'
       ,'Online purchasing access'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1034'
       ,'1'
       ,'1'
       ,'1'
       ,'Photo album'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1035'
       ,'1'
       ,'1'
       ,'1'
       ,'Proofs and prints'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1036'
       ,'1'
       ,'1'
       ,'1'
       ,'Digital proofs and prints online'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'90')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1037'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1038'
       ,'1'
       ,'1'
       ,'1'
       ,'Documentaries'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1039'
       ,'1'
       ,'1'
       ,'1'
       ,'Legal videos'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1040'
       ,'1'
       ,'1'
       ,'1'
       ,'Commercials'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1041'
       ,'1'
       ,'1'
       ,'1'
       ,'Live events'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1042'
       ,'1'
       ,'1'
       ,'1'
       ,'Short films'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1043'
       ,'1'
       ,'1'
       ,'1'
       ,'Training videos'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1044'
       ,'1'
       ,'1'
       ,'1'
       ,'Musical productions'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1045'
       ,'1'
       ,'1'
       ,'1'
       ,'Scholarship videos'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'8'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1046'
       ,'1'
       ,'1'
       ,'1'
       ,'Home movies transfer'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1047'
       ,'1'
       ,'1'
       ,'1'
       ,'Video transfer'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1048'
       ,'1'
       ,'1'
       ,'1'
       ,'Video/DVD duplication'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1049'
       ,'1'
       ,'1'
       ,'1'
       ,'CD/Audio Services'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1050'
       ,'1'
       ,'1'
       ,'1'
       ,'Photo/Slide montages'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1051'
       ,'1'
       ,'1'
       ,'1'
       ,'Editing'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1052'
       ,'1'
       ,'1'
       ,'1'
       ,'DVD authoring'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1053'
       ,'1'
       ,'1'
       ,'1'
       ,'PowerPoint conversion'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'8'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1054'
       ,'1'
       ,'1'
       ,'1'
       ,'Internet video conversion'
       ,''
       ,'1/8/2013 12:00:00 AM'
       ,'1/8/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'9'
       ,'198')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1055'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Windows XP'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1056'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Windows Vista'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1057'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Windows 7'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1058'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Windows 8'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1059'
       ,'1'
       ,'1'
       ,'1'
       ,'Apple OS X'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1060'
       ,'1'
       ,'1'
       ,'1'
       ,'Apple iOS'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1061'
       ,'1'
       ,'1'
       ,'1'
       ,'Linux'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1062'
       ,'1'
       ,'1'
       ,'1'
       ,'Android'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'8'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1063'
       ,'1'
       ,'1'
       ,'1'
       ,'Desktops'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1064'
       ,'1'
       ,'1'
       ,'1'
       ,'Laptops'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1065'
       ,'1'
       ,'1'
       ,'1'
       ,'Tablets'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1066'
       ,'1'
       ,'1'
       ,'1'
       ,'Mobile phones'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1067'
       ,'1'
       ,'1'
       ,'1'
       ,'Printers'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1068'
       ,'1'
       ,'1'
       ,'1'
       ,'Internet routers'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1069'
       ,'1'
       ,'1'
       ,'1'
       ,'Monitors/Displays'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1070'
       ,'1'
       ,'1'
       ,'1'
       ,'Projectors'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'8'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1071'
       ,'1'
       ,'1'
       ,'1'
       ,'Speakers'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'9'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1072'
       ,'1'
       ,'1'
       ,'1'
       ,'Bluetooth/Wireless devices'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'10'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1073'
       ,'1'
       ,'1'
       ,'1'
       ,'Scanners'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'11'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1074'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Word'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1075'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Excel'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1076'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft PowerPoint'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1077'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Access'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1078'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Outlook'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1079'
       ,'1'
       ,'1'
       ,'1'
       ,'Adobe Photoshop'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1080'
       ,'1'
       ,'1'
       ,'1'
       ,'Adobe Dreamweaver'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1081'
       ,'1'
       ,'1'
       ,'1'
       ,'Adpbe Illustrator'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1082'
       ,'1'
       ,'1'
       ,'1'
       ,'Adobe Flash'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1083'
       ,'1'
       ,'1'
       ,'1'
       ,'Adobe Fireworks'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1084'
       ,'1'
       ,'1'
       ,'1'
       ,'Adobe InDesign'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1085'
       ,'1'
       ,'1'
       ,'1'
       ,'Keynote'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1086'
       ,'1'
       ,'1'
       ,'1'
       ,'iPhoto'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1087'
       ,'1'
       ,'1'
       ,'1'
       ,'iCal'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1088'
       ,'1'
       ,'1'
       ,'1'
       ,'Apple Mail'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1089'
       ,'1'
       ,'1'
       ,'1'
       ,'VMWare Fusion'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1090'
       ,'1'
       ,'1'
       ,'1'
       ,'Parallels'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1091'
       ,'1'
       ,'1'
       ,'1'
       ,'iTunes'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1092'
       ,'1'
       ,'1'
       ,'1'
       ,'Camtasia'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1093'
       ,'1'
       ,'1'
       ,'1'
       ,'Microsoft Publisher'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1094'
       ,'1'
       ,'1'
       ,'1'
       ,'Quicken'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1095'
       ,'1'
       ,'1'
       ,'1'
       ,'Quickbooks'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1096'
       ,'1'
       ,'1'
       ,'1'
       ,'Google Apps (Gmail, Calendar, Docs)'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1097'
       ,'1'
       ,'1'
       ,'1'
       ,'Basic operating system tips and tricks'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1098'
       ,'1'
       ,'1'
       ,'1'
       ,'Advanced operating system tips and tricks'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'2'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1099'
       ,'1'
       ,'1'
       ,'1'
       ,'Device setup '
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1100'
       ,'1'
       ,'1'
       ,'1'
       ,'Wifi/internet connection setup'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'4'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1101'
       ,'1'
       ,'1'
       ,'1'
       ,'Software tutorials'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'5'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1102'
       ,'1'
       ,'1'
       ,'1'
       ,'Software downloading and installation'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'6'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1103'
       ,'1'
       ,'1'
       ,'1'
       ,'Photo downloading '
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'7'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1104'
       ,'1'
       ,'1'
       ,'1'
       ,'Photo printing'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'8'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1105'
       ,'1'
       ,'1'
       ,'1'
       ,'Organization'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'9'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1106'
       ,'1'
       ,'1'
       ,'1'
       ,'Synchronization'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'10'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1107'
       ,'1'
       ,'1'
       ,'1'
       ,'Social media profile creation (Facebook, LInkedIn, Google+)'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'11'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1108'
       ,'1'
       ,'1'
       ,'1'
       ,'Siri personal assistant tutorials'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'12'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1109'
       ,'1'
       ,'1'
       ,'1'
       ,'Password management'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'13'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1110'
       ,'1'
       ,'1'
       ,'1'
       ,'Shortcuts tutorial'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'14'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1111'
       ,'1'
       ,'1'
       ,'1'
       ,'Virus software installation'
       ,''
       ,'1/9/2013 12:00:00 AM'
       ,'1/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'3'
       ,'257')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1112'
       ,'1'
       ,'1'
       ,'1'
       ,'Allergies'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1113'
       ,'1'
       ,'1'
       ,'1'
       ,'Anaesthesia'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1114'
       ,'1'
       ,'1'
       ,'1'
       ,'Asthma'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1115'
       ,'1'
       ,'1'
       ,'1'
       ,'Arthritis'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1116'
       ,'1'
       ,'1'
       ,'1'
       ,'Cancer'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1117'
       ,'1'
       ,'1'
       ,'1'
       ,'Chronic pain'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1118'
       ,'1'
       ,'1'
       ,'1'
       ,'Dentistry'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1119'
       ,'1'
       ,'1'
       ,'1'
       ,'Eczema'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1120'
       ,'1'
       ,'1'
       ,'1'
       ,'Headaches/Migraines'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1121'
       ,'1'
       ,'1'
       ,'1'
       ,'Immune system'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1122'
       ,'1'
       ,'1'
       ,'1'
       ,'Insomnia'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1123'
       ,'1'
       ,'1'
       ,'1'
       ,'Irritable bowel syndrome (IBS) '
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1124'
       ,'1'
       ,'1'
       ,'1'
       ,'Neuropathy'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1125'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight issues'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1126'
       ,'1'
       ,'1'
       ,'1'
       ,'Sexual dysfunction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1127'
       ,'1'
       ,'1'
       ,'1'
       ,'Warts'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1128'
       ,'1'
       ,'1'
       ,'1'
       ,'Fibromyalgia'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1129'
       ,'1'
       ,'1'
       ,'1'
       ,'High Blood Pressure'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1130'
       ,'1'
       ,'1'
       ,'1'
       ,'Addictions'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1131'
       ,'1'
       ,'1'
       ,'1'
       ,'Alcoholism'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1132'
       ,'1'
       ,'1'
       ,'1'
       ,'Anger'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1133'
       ,'1'
       ,'1'
       ,'1'
       ,'Anxiety'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1134'
       ,'1'
       ,'1'
       ,'1'
       ,'Bereavement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1135'
       ,'1'
       ,'1'
       ,'1'
       ,'Depression'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1136'
       ,'1'
       ,'1'
       ,'1'
       ,'Ego issues'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1137'
       ,'1'
       ,'1'
       ,'1'
       ,'Fears/Phobias'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1138'
       ,'1'
       ,'1'
       ,'1'
       ,'Food issues'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1139'
       ,'1'
       ,'1'
       ,'1'
       ,'Grief'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1140'
       ,'1'
       ,'1'
       ,'1'
       ,'Heartache'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1141'
       ,'1'
       ,'1'
       ,'1'
       ,'Insecurities'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1142'
       ,'1'
       ,'1'
       ,'1'
       ,'Inner conflict'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1143'
       ,'1'
       ,'1'
       ,'1'
       ,'Panic attacks'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1144'
       ,'1'
       ,'1'
       ,'1'
       ,'Life decisions'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1145'
       ,'1'
       ,'1'
       ,'1'
       ,'Panic attacks'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1146'
       ,'1'
       ,'1'
       ,'1'
       ,'Procrastination'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1147'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1148'
       ,'1'
       ,'1'
       ,'1'
       ,'Teeth grinding'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1149'
       ,'1'
       ,'1'
       ,'1'
       ,'Procrastination'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1150'
       ,'1'
       ,'1'
       ,'1'
       ,'Writers block'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1151'
       ,'1'
       ,'1'
       ,'1'
       ,'Obsessive compulsive disorder (OCD) '
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1152'
       ,'1'
       ,'1'
       ,'1'
       ,'Post traumatic stress disorder (PTSD)'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1153'
       ,'1'
       ,'1'
       ,'1'
       ,'Divorce/Marital problems'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1154'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoking'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1155'
       ,'1'
       ,'1'
       ,'1'
       ,'Self-esteem issues'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1156'
       ,'1'
       ,'1'
       ,'1'
       ,'Motivation'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1157'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports performance'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1158'
       ,'1'
       ,'1'
       ,'1'
       ,'Studying efficacy'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1159'
       ,'1'
       ,'1'
       ,'1'
       ,'Memory improvement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1160'
       ,'1'
       ,'1'
       ,'1'
       ,'Memory recovery'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1161'
       ,'1'
       ,'1'
       ,'1'
       ,'Dream recolation'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1162'
       ,'1'
       ,'1'
       ,'1'
       ,'Past-life regression'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1163'
       ,'1'
       ,'1'
       ,'1'
       ,'Childbirth'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'146')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1164'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1165'
       ,'1'
       ,'1'
       ,'1'
       ,'Decreased anxiety'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1166'
       ,'1'
       ,'1'
       ,'1'
       ,'Disease/Illness prevention'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1167'
       ,'1'
       ,'1'
       ,'1'
       ,'Increased healing effects'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1168'
       ,'1'
       ,'1'
       ,'1'
       ,'Disease symptom relief'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1169'
       ,'1'
       ,'1'
       ,'1'
       ,'Emotional/Mental blockage removal'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1170'
       ,'1'
       ,'1'
       ,'1'
       ,'Immune system enhancement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1171'
       ,'1'
       ,'1'
       ,'1'
       ,'Deep relaxation'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1172'
       ,'1'
       ,'1'
       ,'1'
       ,'Sleep improvement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1173'
       ,'1'
       ,'1'
       ,'1'
       ,'Blood pressure reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1174'
       ,'1'
       ,'1'
       ,'1'
       ,'Pain reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1175'
       ,'1'
       ,'1'
       ,'1'
       ,'Reduction in side effects of drugs/treatments'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1176'
       ,'1'
       ,'1'
       ,'1'
       ,'Increases vitality'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1177'
       ,'1'
       ,'1'
       ,'1'
       ,'Spritual growth'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1178'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui Reiki Ryoho Gakkai'
       ,'"Usui Reiki Healing Method Learning Society" is the name of the society of Reiki masters founded by Mikao Usui. His style is assumed to have survived to the present day (assumed as no-one knows exactly how the Gakkai practises nowadays),
 with Ushida being the one who,
 upon death,
 substituted the presidency of the association. This society remained secret for many years and at present,
 the shihan (master),
 Masaki Kondoh,
 is the president of the Gakkai. Though many of their teachings still remain secret,
 little by little,
 members of this association — such as Master Hiroshi Doi — have been sharing their knowledge with the rest of the world. In spite of this,
 it continues to be a hermetic society,
 nearly impossible to access. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1179'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui/Tibetan Reiki'
       ,' the system that was developed by Arthur Robertson and later popularised by William Lee Rand and Diane Stein.This system is derived from Usui Reiki as taught by Takata and includes techniques from the Usui Reiki Ryoho Gakkai,
 such as Byosen-ho (
 Scanning Method),
 Gyoshi-ho (
 Healing Eyes Method),
 and Kenyoku-ho (
 Dry Bathing Method). There have been a few additions to this system in comparison with Usui Shiki Ryoho by Rand,
 such as a modified attunement method that incorporates the Violet Breath,
 the use of the Tibetan Master and kundalini fire symbols along with the four traditional Usui symbols,
 the hui yin position (located in the perineum),
 and also the microcosmic orbit. Along with introducing the above,
 Usui/Tibetan Reiki can sometimes incorporate psychic surgery. Unlike Usui Reiki Shiki Ryoho,
 it has four levels,
 commonly called First Degree,
 Second Degree,
 Advanced Reiki Training (commonly 3A or ART),
 and Master/Teacher (commonly 3B).[http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1180'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui Shiki Ryoho'
       ,' "Usui''s Spiritual Energy Style of Therapy",
 but a more literal translation is "Usui''s Spiritual Energy Style of Medical Treatment" (Ryoho meaning medical treatment)) is the name given to the Western system of Reiki,
 and is a system that has tried to stay near enough the same as the original practises of Hawayo Takata. It is taught today by,
 for instance,
 the Reiki Alliance,
 led by Phyllis Lei Furumoto,
 Takata''s granddaughter.In this system,
 as with most Western systems of Reiki,
 there are three levels,
 respectively called the First Degree,
 Second Degree,
 and Master/Teacher Degree,
 which uses Takata''s versions of the four original symbols passed to her by Hayashi. Usui Reiki Shiki Ryoho is also the norm requested qualification (along with Reiki lineage) when seeking insurance to practise Reiki on the general public in the United Kingdom.[http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1182'
       ,'1'
       ,'1'
       ,'1'
       ,'Gendai Reiki Ho'
       ,'"Modern Spiritual Energy Method") is a system that incorporates elements of both Japanese and Western Reiki,
 and was established by Hiroshi Doi. Doi was first trained in Western Reiki by Mieko Mitsui,
 a Master of the "Radiance Technique." In 1993,
 he was granted membership to Usui Reiki Ryoho Gakkai. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1183'
       ,'1'
       ,'1'
       ,'1'
       ,'Jikiden Reiki'
       ,'"The Direct Teaching [of] Spiritual Energy" is the name given to the original system that was taught by Dr. Hayashi,
 and was founded by Mrs. Yamaguchi and her son,
 Tadao Yamaguchi.  [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1184'
       ,'1'
       ,'1'
       ,'1'
       ,'Komyo Reiki'
       ,'"Enlightened Spiritual Energy Meeting (Association)" is the name given to the system that takes the name of a school of Japanese Traditional Reiki,
 and was established by Hyakuten Inamoto,
 a Reiki teacher with Western Reiki background. It differs from other systems in that it does not originate with the Gakkai,
 but instead comes from the Hayashi line,
 through Chiyoko Yamaguchi that remained in Japan. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1186'
       ,'1'
       ,'1'
       ,'1'
       ,'Reido Reiki'
       ,'"Spiritual Occurrence [and] Spiritual Energy Society" is the name given to the system that derives from the masters of the Ryoho Gakkai,
 and is led by Fuminori Aoki,
 who added to the teaching of the Gakkai,
 though differences in teaching are minimal. In this system,
 the Koriki (meaning "the force of happiness") symbol that inspired Fuminori Aoki has been adopted.  [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'279')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1187'
       ,'1'
       ,'1'
       ,'1'
       ,'Americano'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1188'
       ,'1'
       ,'1'
       ,'1'
       ,'Bacardi Cocktail'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1189'
       ,'1'
       ,'1'
       ,'1'
       ,'Bronx'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1190'
       ,'1'
       ,'1'
       ,'1'
       ,'Banana Daiquiri'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1191'
       ,'1'
       ,'1'
       ,'1'
       ,'Frozen Daiquiri'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1192'
       ,'1'
       ,'1'
       ,'1'
       ,'Daiquiri'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1193'
       ,'1'
       ,'1'
       ,'1'
       ,'Gibson'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1194'
       ,'1'
       ,'1'
       ,'1'
       ,'Kir'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1195'
       ,'1'
       ,'1'
       ,'1'
       ,'Kir Royal'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1196'
       ,'1'
       ,'1'
       ,'1'
       ,'Manhattan Dry'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1197'
       ,'1'
       ,'1'
       ,'1'
       ,'Manhattan Medium'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1198'
       ,'1'
       ,'1'
       ,'1'
       ,'Manhattan'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1199'
       ,'1'
       ,'1'
       ,'1'
       ,'Margarita'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1200'
       ,'1'
       ,'1'
       ,'1'
       ,'Martini (Dry)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1201'
       ,'1'
       ,'1'
       ,'1'
       ,'Martini (Perfect)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1202'
       ,'1'
       ,'1'
       ,'1'
       ,'Martini (Sweet)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1203'
       ,'1'
       ,'1'
       ,'1'
       ,'Martini (Vodka)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1204'
       ,'1'
       ,'1'
       ,'1'
       ,'Negroni'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1205'
       ,'1'
       ,'1'
       ,'1'
       ,'Old Fashioned'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1206'
       ,'1'
       ,'1'
       ,'1'
       ,'Paradise'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1207'
       ,'1'
       ,'1'
       ,'1'
       ,'Rob Roy'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1208'
       ,'1'
       ,'1'
       ,'1'
       ,'Rose'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1209'
       ,'1'
       ,'1'
       ,'1'
       ,'Whiskey Sour'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1210'
       ,'1'
       ,'1'
       ,'1'
       ,'Black Russian'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1211'
       ,'1'
       ,'1'
       ,'1'
       ,'Brandy Alexander'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1212'
       ,'1'
       ,'1'
       ,'1'
       ,'French Connection'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1213'
       ,'1'
       ,'1'
       ,'1'
       ,'God Father'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1214'
       ,'1'
       ,'1'
       ,'1'
       ,'God Mother'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1215'
       ,'1'
       ,'1'
       ,'1'
       ,'Golden Cadillac'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1216'
       ,'1'
       ,'1'
       ,'1'
       ,'Golden Dream'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1217'
       ,'1'
       ,'1'
       ,'1'
       ,'Grasshopper'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1218'
       ,'1'
       ,'1'
       ,'1'
       ,'Porto flip'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1219'
       ,'1'
       ,'1'
       ,'1'
       ,'Rusty Nail'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1220'
       ,'1'
       ,'1'
       ,'1'
       ,'White Russian'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1221'
       ,'1'
       ,'1'
       ,'1'
       ,'Bellini'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1222'
       ,'1'
       ,'1'
       ,'1'
       ,'Bloody Mary'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1223'
       ,'1'
       ,'1'
       ,'1'
       ,'Buck''s Fizz'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1224'
       ,'1'
       ,'1'
       ,'1'
       ,'Brandy Egg Nog'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1225'
       ,'1'
       ,'1'
       ,'1'
       ,'Champagne Cocktail'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1226'
       ,'1'
       ,'1'
       ,'1'
       ,'Gin Fizz'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1227'
       ,'1'
       ,'1'
       ,'1'
       ,'Harvey Wallbanger'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1228'
       ,'1'
       ,'1'
       ,'1'
       ,'Horse''s Neck'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1229'
       ,'1'
       ,'1'
       ,'1'
       ,'Irish Coffee'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1230'
       ,'1'
       ,'1'
       ,'1'
       ,'Tom Collins'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1231'
       ,'1'
       ,'1'
       ,'1'
       ,'Mimosa'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1232'
       ,'1'
       ,'1'
       ,'1'
       ,'Planter''s Punch'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1233'
       ,'1'
       ,'1'
       ,'1'
       ,'Piña Colada'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1234'
       ,'1'
       ,'1'
       ,'1'
       ,'Screwdriver'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1235'
       ,'1'
       ,'1'
       ,'1'
       ,'Singapore Sling'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1236'
       ,'1'
       ,'1'
       ,'1'
       ,'Tequila Sunrise'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1237'
       ,'1'
       ,'1'
       ,'1'
       ,'Apple Martini'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1238'
       ,'1'
       ,'1'
       ,'1'
       ,'B-52'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1239'
       ,'1'
       ,'1'
       ,'1'
       ,'Caipirinha'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1240'
       ,'1'
       ,'1'
       ,'1'
       ,'Cosmopolitan'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1241'
       ,'1'
       ,'1'
       ,'1'
       ,'Cuba Libre'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1242'
       ,'1'
       ,'1'
       ,'1'
       ,'Japanese Slipper'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1243'
       ,'1'
       ,'1'
       ,'1'
       ,'Kamikaze'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1244'
       ,'1'
       ,'1'
       ,'1'
       ,'Long Island Iced Tea'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1245'
       ,'1'
       ,'1'
       ,'1'
       ,'Mai Tai'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1246'
       ,'1'
       ,'1'
       ,'1'
       ,'Mojito'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1248'
       ,'1'
       ,'1'
       ,'1'
       ,'Sea-Breeze'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1249'
       ,'1'
       ,'1'
       ,'1'
       ,'Sex on the Beach'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1250'
       ,'1'
       ,'1'
       ,'1'
       ,'Bar rental'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1251'
       ,'1'
       ,'1'
       ,'1'
       ,'Glasses rental'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1252'
       ,'1'
       ,'1'
       ,'1'
       ,'Table and chairs rental'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1253'
       ,'1'
       ,'1'
       ,'1'
       ,'Shopping for alcohol (with reimbursement)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1254'
       ,'1'
       ,'1'
       ,'1'
       ,'Mixology classes'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1255'
       ,'1'
       ,'1'
       ,'1'
       ,'Fundraisers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1256'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1257'
       ,'1'
       ,'1'
       ,'1'
       ,'Bachelor/Bachelorette parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1258'
       ,'1'
       ,'1'
       ,'1'
       ,'Festivals'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1259'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1260'
       ,'1'
       ,'1'
       ,'1'
       ,'Holiday events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1261'
       ,'1'
       ,'1'
       ,'1'
       ,'Private parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1262'
       ,'1'
       ,'1'
       ,'1'
       ,'Baby showers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1263'
       ,'1'
       ,'1'
       ,'1'
       ,'Bridal showers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1264'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'39')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1265'
       ,'1'
       ,'1'
       ,'1'
       ,'Lawn parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1266'
       ,'1'
       ,'1'
       ,'1'
       ,'House warmings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1267'
       ,'1'
       ,'1'
       ,'1'
       ,'Pool parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1268'
       ,'1'
       ,'1'
       ,'1'
       ,'Backyard luaus'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1269'
       ,'1'
       ,'1'
       ,'1'
       ,'Holiday gatherings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1270'
       ,'1'
       ,'1'
       ,'1'
       ,'Tiny apartment parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1271'
       ,'1'
       ,'1'
       ,'1'
       ,'Urban loft parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1272'
       ,'1'
       ,'1'
       ,'1'
       ,'Picnic luncheons'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1273'
       ,'1'
       ,'1'
       ,'1'
       ,'Game day gatherings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1274'
       ,'1'
       ,'1'
       ,'1'
       ,'Bridal showers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1275'
       ,'1'
       ,'1'
       ,'1'
       ,'Masquerade balls'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1276'
       ,'1'
       ,'1'
       ,'1'
       ,'Bachelor/Bachelorette parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1277'
       ,'1'
       ,'1'
       ,'1'
       ,'Festivals'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1278'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1279'
       ,'1'
       ,'1'
       ,'1'
       ,'Baby showers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1280'
       ,'1'
       ,'1'
       ,'1'
       ,'Anniversary parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1281'
       ,'1'
       ,'1'
       ,'1'
       ,'Engagement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1282'
       ,'1'
       ,'1'
       ,'1'
       ,'Retirement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1283'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1284'
       ,'1'
       ,'1'
       ,'1'
       ,'Fundraisers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1285'
       ,'1'
       ,'1'
       ,'1'
       ,'Venue research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1286'
       ,'1'
       ,'1'
       ,'1'
       ,'DJs/Entertainment research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1287'
       ,'1'
       ,'1'
       ,'1'
       ,'Caterer research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1288'
       ,'1'
       ,'1'
       ,'1'
       ,'Transportation research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1289'
       ,'1'
       ,'1'
       ,'1'
       ,'Lodging research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1290'
       ,'1'
       ,'1'
       ,'1'
       ,'Vendor contract review'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1291'
       ,'1'
       ,'1'
       ,'1'
       ,'Procurement of favors/gifts'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1292'
       ,'1'
       ,'1'
       ,'1'
       ,'Vendor coordination'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1293'
       ,'1'
       ,'1'
       ,'1'
       ,'Day-of timeline creation'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1294'
       ,'1'
       ,'1'
       ,'1'
       ,'Print material design (programs, flyers, signs)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1295'
       ,'1'
       ,'1'
       ,'1'
       ,'Decoration research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1296'
       ,'1'
       ,'1'
       ,'1'
       ,'Photographer/Videographer research'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'151')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1297'
       ,'1'
       ,'1'
       ,'1'
       ,'Fundraisers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1298'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1299'
       ,'1'
       ,'1'
       ,'1'
       ,'Festivals'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1300'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1301'
       ,'1'
       ,'1'
       ,'1'
       ,'Holiday events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1302'
       ,'1'
       ,'1'
       ,'1'
       ,'Private parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1303'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1304'
       ,'1'
       ,'1'
       ,'1'
       ,'Anniversary parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1305'
       ,'1'
       ,'1'
       ,'1'
       ,'Engagement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1306'
       ,'1'
       ,'1'
       ,'1'
       ,'Retirement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1307'
       ,'1'
       ,'1'
       ,'1'
       ,'Sound system'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1308'
       ,'1'
       ,'1'
       ,'1'
       ,'Fog machine'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1309'
       ,'1'
       ,'1'
       ,'1'
       ,'Disco lighting'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1310'
       ,'1'
       ,'1'
       ,'1'
       ,'Microphones (wired)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1311'
       ,'1'
       ,'1'
       ,'1'
       ,'Portable stage'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1312'
       ,'1'
       ,'1'
       ,'1'
       ,'Outdoor event lighting'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1313'
       ,'1'
       ,'1'
       ,'1'
       ,'Indoor event lighting'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1314'
       ,'1'
       ,'1'
       ,'1'
       ,'Microphones (wireless)'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1315'
       ,'1'
       ,'1'
       ,'1'
       ,'Video screen'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1316'
       ,'1'
       ,'1'
       ,'1'
       ,'Projector'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1317'
       ,'1'
       ,'1'
       ,'1'
       ,'Portable dance floor'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1318'
       ,'1'
       ,'1'
       ,'1'
       ,'African'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1319'
       ,'1'
       ,'1'
       ,'1'
       ,'Asian'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1320'
       ,'1'
       ,'1'
       ,'1'
       ,'Avant-Garde'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1321'
       ,'1'
       ,'1'
       ,'1'
       ,'Blues'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1322'
       ,'1'
       ,'1'
       ,'1'
       ,'Brazilian Music'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1323'
       ,'1'
       ,'1'
       ,'1'
       ,'Caribbean Music'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1324'
       ,'1'
       ,'1'
       ,'1'
       ,'Country'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1325'
       ,'1'
       ,'1'
       ,'1'
       ,'Easy listening'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1326'
       ,'1'
       ,'1'
       ,'1'
       ,'Electronic'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1327'
       ,'1'
       ,'1'
       ,'1'
       ,'Modern folk'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1328'
       ,'1'
       ,'1'
       ,'1'
       ,'Hip Hop'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1329'
       ,'1'
       ,'1'
       ,'1'
       ,'Jazz'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1330'
       ,'1'
       ,'1'
       ,'1'
       ,'Latin American'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1331'
       ,'1'
       ,'1'
       ,'1'
       ,'Pop'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1332'
       ,'1'
       ,'1'
       ,'1'
       ,'R&B'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1333'
       ,'1'
       ,'1'
       ,'1'
       ,'Rock'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'251')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1334'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1335'
       ,'1'
       ,'1'
       ,'1'
       ,'Decreased anxiety'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1336'
       ,'1'
       ,'1'
       ,'1'
       ,'Disease/Illness prevention'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1337'
       ,'1'
       ,'1'
       ,'1'
       ,'Increased healing effects'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1338'
       ,'1'
       ,'1'
       ,'1'
       ,'Disease symptom relief'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1339'
       ,'1'
       ,'1'
       ,'1'
       ,'Emotional/Mental blockage removal'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1340'
       ,'1'
       ,'1'
       ,'1'
       ,'Immune system enhancement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1341'
       ,'1'
       ,'1'
       ,'1'
       ,'Deep relaxation'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1342'
       ,'1'
       ,'1'
       ,'1'
       ,'Sleep improvement'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1343'
       ,'1'
       ,'1'
       ,'1'
       ,'Blood pressure reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1344'
       ,'1'
       ,'1'
       ,'1'
       ,'Pain reduction'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1345'
       ,'1'
       ,'1'
       ,'1'
       ,'Reduction in side effects of drugs/treatments'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1346'
       ,'1'
       ,'1'
       ,'1'
       ,'Increases vitality'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1347'
       ,'1'
       ,'1'
       ,'1'
       ,'Spritual growth'
       ,''
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1348'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui Reiki Ryoho Gakkai'
       ,'"Usui Reiki Healing Method Learning Society" is the name of the society of Reiki masters founded by Mikao Usui. His style is assumed to have survived to the present day (assumed as no-one knows exactly how the Gakkai practises nowadays),
 with Ushida being the one who,
 upon death,
 substituted the presidency of the association. This society remained secret for many years and at present,
 the shihan (master),
 Masaki Kondoh,
 is the president of the Gakkai. Though many of their teachings still remain secret,
 little by little,
 members of this association — such as Master Hiroshi Doi — have been sharing their knowledge with the rest of the world. In spite of this,
 it continues to be a hermetic society,
 nearly impossible to access. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1349'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui/Tibetan Reiki'
       ,' the system that was developed by Arthur Robertson and later popularised by William Lee Rand and Diane Stein.This system is derived from Usui Reiki as taught by Takata and includes techniques from the Usui Reiki Ryoho Gakkai,
 such as Byosen-ho (
 Scanning Method),
 Gyoshi-ho (
 Healing Eyes Method),
 and Kenyoku-ho (
 Dry Bathing Method). There have been a few additions to this system in comparison with Usui Shiki Ryoho by Rand,
 such as a modified attunement method that incorporates the Violet Breath,
 the use of the Tibetan Master and kundalini fire symbols along with the four traditional Usui symbols,
 the hui yin position (located in the perineum),
 and also the microcosmic orbit. Along with introducing the above,
 Usui/Tibetan Reiki can sometimes incorporate psychic surgery. Unlike Usui Reiki Shiki Ryoho,
 it has four levels,
 commonly called First Degree,
 Second Degree,
 Advanced Reiki Training (commonly 3A or ART),
 and Master/Teacher (commonly 3B).[http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1350'
       ,'1'
       ,'1'
       ,'1'
       ,'Usui Shiki Ryoho'
       ,' "Usui''s Spiritual Energy Style of Therapy",
 but a more literal translation is "Usui''s Spiritual Energy Style of Medical Treatment" (Ryoho meaning medical treatment)) is the name given to the Western system of Reiki,
 and is a system that has tried to stay near enough the same as the original practises of Hawayo Takata. It is taught today by,
 for instance,
 the Reiki Alliance,
 led by Phyllis Lei Furumoto,
 Takata''s granddaughter.In this system,
 as with most Western systems of Reiki,
 there are three levels,
 respectively called the First Degree,
 Second Degree,
 and Master/Teacher Degree,
 which uses Takata''s versions of the four original symbols passed to her by Hayashi. Usui Reiki Shiki Ryoho is also the norm requested qualification (along with Reiki lineage) when seeking insurance to practise Reiki on the general public in the United Kingdom.[http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1351'
       ,'1'
       ,'1'
       ,'1'
       ,'Gendai Reiki Ho'
       ,'"Modern Spiritual Energy Method") is a system that incorporates elements of both Japanese and Western Reiki,
 and was established by Hiroshi Doi. Doi was first trained in Western Reiki by Mieko Mitsui,
 a Master of the "Radiance Technique." In 1993,
 he was granted membership to Usui Reiki Ryoho Gakkai. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1352'
       ,'1'
       ,'1'
       ,'1'
       ,'Jikiden Reiki'
       ,'"The Direct Teaching [of] Spiritual Energy" is the name given to the original system that was taught by Dr. Hayashi,
 and was founded by Mrs. Yamaguchi and her son,
 Tadao Yamaguchi.  [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1353'
       ,'1'
       ,'1'
       ,'1'
       ,'Komyo Reiki'
       ,'"Enlightened Spiritual Energy Meeting (Association)" is the name given to the system that takes the name of a school of Japanese Traditional Reiki,
 and was established by Hyakuten Inamoto,
 a Reiki teacher with Western Reiki background. It differs from other systems in that it does not originate with the Gakkai,
 but instead comes from the Hayashi line,
 through Chiyoko Yamaguchi that remained in Japan. [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1354'
       ,'1'
       ,'1'
       ,'1'
       ,'Reido Reiki'
       ,'"Spiritual Occurrence [and] Spiritual Energy Society" is the name given to the system that derives from the masters of the Ryoho Gakkai,
 and is led by Fuminori Aoki,
 who added to the teaching of the Gakkai,
 though differences in teaching are minimal. In this system,
 the Koriki (meaning "the force of happiness") symbol that inspired Fuminori Aoki has been adopted.  [http://en.wikipedia.org/wiki/Reiki]'
       ,'1/10/2013 12:00:00 AM'
       ,'1/10/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'283')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1355'
       ,'1'
       ,'1'
       ,'1'
       ,'Wash bed linens & towels'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1356'
       ,'1'
       ,'1'
       ,'1'
       ,'Self-cleaning oven'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1357'
       ,'1'
       ,'1'
       ,'1'
       ,'Light ironing on request'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1358'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1359'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1360'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1361'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1362'
       ,'1'
       ,'1'
       ,'1'
       ,'Bed making'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1363'
       ,'1'
       ,'1'
       ,'1'
       ,'Light wall cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1364'
       ,'1'
       ,'1'
       ,'1'
       ,'Occasional floor waxing'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1365'
       ,'1'
       ,'1'
       ,'1'
       ,'Occasional window cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1366'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1367'
       ,'1'
       ,'1'
       ,'1'
       ,'Occasional refrigerator cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1368'
       ,'1'
       ,'1'
       ,'1'
       ,'Light dish cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1369'
       ,'1'
       ,'1'
       ,'1'
       ,'Occasional oven cleaning'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1370'
       ,'1'
       ,'1'
       ,'1'
       ,'Wash bed linens & towels'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1371'
       ,'1'
       ,'1'
       ,'1'
       ,'Self-cleaning oven'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1372'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1373'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1374'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1375'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1376'
       ,'1'
       ,'1'
       ,'1'
       ,'Bed making'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1377'
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
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1378'
       ,'1'
       ,'1'
       ,'1'
       ,'Light dish cleaning'
       ,NULL
       ,'7/7/2011 12:00:00 AM'
       ,'7/7/2011 12:00:00 AM'
       ,'dj'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1379'
       ,'1'
       ,'1'
       ,'1'
       ,'Start laundry'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1380'
       ,'1'
       ,'1'
       ,'1'
       ,'Self-cleaning oven'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1381'
       ,'1'
       ,'1'
       ,'1'
       ,'Vacuum'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1382'
       ,'1'
       ,'1'
       ,'1'
       ,'Broom/Dustpan'
       ,NULL
       ,'10/27/2011 12:00:00 AM'
       ,'10/27/2011 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'14')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1383'
       ,'1'
       ,'1'
       ,'1'
       ,'Ananda'
       ,'Ananda Yoga, or Ananda Yoga for Higher Awareness is a system of Hatha Yoga established by Swami Kriyananda, a disciple of Paramhansa Yogananda, and is based on his Kriya Yoga teachings. Ananda Yoga emphasizes inner awareness; energy control; and the experience of each asana as a natural expression of a higher state of consciousness, which is enhanced by the use of affirmations. [http://en.wikipedia.org/wiki/Ananda_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1384'
       ,'1'
       ,'1'
       ,'1'
       ,'Ashtanga'
       ,'Ashtanga Yoga is a system of yoga popularized by K. Pattabhi Jois, and which is often promoted as a modern-day form of classical Indian yoga. Pattabhi Jois began his yoga studies in 1927 at the age of 12, and by 1948 had established an institute for teaching the specific yoga practice known as Ashtanga (Sanskrit for "eight-limbed") Yoga.
Power Yoga and vinyasa yoga are generic terms that may refer to any type of vigorous yoga exercise derived from Ashtanga Vinyasa Yoga.[http://en.wikipedia.org/wiki/Ashtanga_Vinyasa_Yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1385'
       ,'1'
       ,'1'
       ,'1'
       ,'Bikram'
       ,'Bikram Yoga,
 is a system of yoga that Bikram Choudhury synthesized from traditional hatha yoga techniques and popularized beginning in the early 1970s. Bikram Yoga sessions run for exactly 90 minutes and consist of a set series of 26 postures including 2 breathing exercises. Bikram Yoga is ideally practiced in a room heated to 105°F (˜ 40.6°C) with a humidity of 40%.[http://en.wikipedia.org/wiki/Bikram_Yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1386'
       ,'1'
       ,'1'
       ,'1'
       ,'Hatha'
       ,'Hatha yoga,
 also called hatha vidya,
 is a system of yoga described by Yogi Swatmarama,
 a Hindu sage of 15th century India,
 and compiler of the Hatha Yoga Pradipika.
The Sanskrit term ha?ha refers to the use of persistence or force,
 and ha?hayoga is translated by the Monier-Williams dictionary as "a kind of forced Yoga or abstract meditation (forcing the mind to withdraw from external objects; treated of in the Ha?ha-pradipika by Svatmarama and performed with much self-torture, such as standing on one leg, holding up the arms, inhaling smoke with the head inverted &c.)." 
Swatmarama introduces his system as preparatory stage of physical purification that the body practices for higher meditation or Yoga. It is based on asanas and pranayama (breathing techniques,
 also known as shatkarma). As opposed to the traditional practice,
 physical focus on Yoga became popular in the west beginning in the second half of the 20th century,
 and is often referred to simply as "Hatha Yoga" in the context of health and physical exercise. [http://en.wikipedia.org/wiki/Hatha_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1387'
       ,'1'
       ,'1'
       ,'1'
       ,'Integral'
       ,'In the teachings of Sri Aurobindo, integral yoga (or purna yoga, Sanskrit for full or complete yoga, sometimes also called supramental yoga) refers to the process of the union of all the parts of one''s being with the Divine, and the transmutation of all of their jarring elements into a harmonious state of higher divine consciousness and existence. [http://en.wikipedia.org/wiki/Integral_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1388'
       ,'1'
       ,'1'
       ,'1'
       ,'Iyengar'
       ,'Iyengar Yoga, named after and developed by B. K. S. Iyengar, is a form of Hatha Yoga that has an emphasis on detail, precision and alignment in the performance of posture (asana) and breath control (pranayama). The development of strength, mobility and stability is gained through the asanas.
B.K.S. Iyengar has systematised over 200 classical yoga poses and 14 different types of Pranayama (with variations of many of them) ranging from the basic to advanced. This helps ensure that students progress gradually by moving from simple poses to more complex ones and develop their mind, body and spirit step-by-step.
Iyengar Yoga often, but not always, makes use of props, such as belts, blocks, and blankets, as aids in performing asanas (postures). The props enable students to perform the asanas correctly, minimising the risk of injury or strain, and making the postures accessible to both young and old.
Iyengar Yoga is firmly based on the traditional eight limbs of yoga as expounded by Patanjali in his Yoga Sutras. [http://en.wikipedia.org/wiki/Iyengar_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1389'
       ,'1'
       ,'1'
       ,'1'
       ,'Jivamukti'
       ,'The Jivamukti Yoga method is a proprietary style of yoga created by David Life and Sharon Gannon in 1984.
Jivamukti is a physical, ethical, and spiritual practice, combining a vigorous hatha yoga, vinyasa-based physical style with adherence to five central tenets: shastra (scripture), bhakti (devotion), ahimsa (non-harming), nada (music), and dhyana (meditation). Animal rights, veganism, environmentalism, and social activism are also emphasized. Jivamukti Yoga has developed a reputation as the chosen yoga style of many celebrities. [http://en.wikipedia.org/wiki/Jivamukti_Yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1390'
       ,'1'
       ,'1'
       ,'1'
       ,'Kundalini'
       ,'Kundalini yoga is a physical,
 mental and spiritual discipline for developing strength,
 awareness,
 character,
 and consciousness. Practitioners call Kundalini Yoga the yoga of awareness because it focuses on the expansion of sensory awareness and intuition in order to raise individual consciousness and merge it with the Infinite consciousness of God. As a form of yoga and meditation,
 Kundalini''s purpose is to cultivate the creative spiritual potential of a human to uphold values,
 speak truth,
 and focus on the compassion and consciousness needed to serve and heal others.[http://en.wikipedia.org/wiki/Kundalini_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1391'
       ,'1'
       ,'1'
       ,'1'
       ,'Sivananda'
       ,'Sivananda Yoga, after teachings of Swami Sivananda, is a non-proprietary form of hatha yoga in which the training focuses on preserving the health and wellness of the practitioner. Sivananda Yoga teachers are all graduates of the Sivananda Yoga Teacher Training Course, and students widely range in age and degrees of ability. Unlike Ashtanga Vinyasa yoga''s more athletic program involving Bandhas, Sivananda training revolves around frequent relaxation, and emphasizes full, yogic breathing. [http://en.wikipedia.org/wiki/Sivananda_Yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1392'
       ,'1'
       ,'1'
       ,'1'
       ,'LGBT friendly'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1393'
       ,'1'
       ,'1'
       ,'1'
       ,'Clean comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1394'
       ,'1'
       ,'1'
       ,'1'
       ,'Blue comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1395'
       ,'1'
       ,'1'
       ,'1'
       ,'Family friendly'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1396'
       ,'1'
       ,'1'
       ,'1'
       ,'Improv comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1397'
       ,'1'
       ,'1'
       ,'1'
       ,'Caberet comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1398'
       ,'1'
       ,'1'
       ,'1'
       ,'Adult comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1399'
       ,'1'
       ,'1'
       ,'1'
       ,'Local comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1400'
       ,'1'
       ,'1'
       ,'1'
       ,'Political comedy'
       ,''
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1401'
       ,'1'
       ,'1'
       ,'1'
       ,'Vinyasa'
       ,'Vinyasa denotes a flowing, dynamic form of yoga, connected to breath or pranayama in which yoga and mudra transitions are embodied as linkages within and between asana. Indeed, this process entrains the mindstream with the bodymind of the aspirant, and fuels the samadhi of Mystery in the adept; in affirmation that no value judgment between the importance or ascendancy of the asana or the transitions between asana is held. This view of non-judgement is grounded, founded and based in the Shunyata Doctrine which informed the development of vinyasa styles. [http://en.wikipedia.org/wiki/Vinyasa_yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1402'
       ,'1'
       ,'1'
       ,'1'
       ,'Power'
       ,'Power Yoga and vinyasa yoga are generic terms that may refer to any type of vigorous yoga exercise derived from Ashtanga Vinyasa Yoga.Ashtanga Yoga is a system of yoga popularized by K. Pattabhi Jois,
 and which is often promoted as a modern-day form of classical Indian yoga. Pattabhi Jois began his yoga studies in 1927 at the age of 12,
 and by 1948 had established an institute for teaching the specific yoga practice known as Ashtanga (Sanskrit for "eight-limbed") Yoga.
[http://en.wikipedia.org/wiki/Ashtanga_Vinyasa_Yoga]'
       ,'2/4/2013 12:00:00 AM'
       ,'2/4/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'278')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1403'
       ,'1'
       ,'1'
       ,'1'
       ,'Fundraisers'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1404'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1405'
       ,'1'
       ,'1'
       ,'1'
       ,'Outdoor events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1406'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1407'
       ,'1'
       ,'1'
       ,'1'
       ,'Holiday events'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1408'
       ,'1'
       ,'1'
       ,'1'
       ,'Private parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1409'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1410'
       ,'1'
       ,'1'
       ,'1'
       ,'Anniversary parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1411'
       ,'1'
       ,'1'
       ,'1'
       ,'Engagement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1412'
       ,'1'
       ,'1'
       ,'1'
       ,'Retirement parties'
       ,''
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'284')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1413'
       ,'1'
       ,'1'
       ,'1'
       ,'External Qigong/Qi Emission'
       ,'External qigong refers to the process by which qigong practitioners direct or emit their qi to others to purge and release toxic emotions from within the body''s tissues, eliminate energetic stagnations, as well as tonify, and regulate the internal organs, immune system, and energetic fields. The practitioner may touch areas on the other person''s body or simply pass his hands over the body. 

When patients are ill and their own level of qi is very low or stagnant, receiving qi from a qigong practitioner can prove to be a powerful stimulant toward recovery. Generally, however, people who receive external qigong from a qigong practitioner, simultaneously do their own internal practice. [http://www.medicalqigong.org/resources.htm#types_of_qigong]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1414'
       ,'1'
       ,'1'
       ,'1'
       ,'Spiritual Qigong'
       ,'This practice takes the form of meditation,
 including moving meditation as well as stillness. As a spiritual discipline,
 qigong leads to self-awareness,
 tranquility,
 and harmony with nature. The spiritual aspect of qigong evolved from Taoism and Buddhism. [http://www.medicalqigong.org/resources.htm#types_of_qigong]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1415'
       ,'1'
       ,'1'
       ,'1'
       ,'Martial/Sports Qigong'
       ,'Qigong practice can improve performance in the martial arts or any other sport. Chinese martial artists designed or helped to improve many qigong techniques as they looked for ways to increase speed, stamina, and power, improve balance, flexibility, and coordination, and condition the body against injury. Qigong exercises can improve performance in any sport, improving the golf drive, tackling ability in football, accuracy in tennis, and stamina in swimming. [http://www.medicalqigong.org/resources.htm#types_of_qigong]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1416'
       ,'1'
       ,'1'
       ,'1'
       ,'Acupuncture'
       ,'Acupuncture means insertion of needles into superficial structures of the body (skin, subcutaneous tissue, muscles) – usually at acupuncture points (acupoints) – and their subsequent manipulation; this aims at influencing the flow of qi. According to TCM it relieves pain and treats (and prevents) various diseases.
Acupuncture is often accompanied by moxibustion – the Chinese characters for acupuncture literally meaning "acupuncture-moxibustion" – which involves burning mugwort on or near the skin at an acupuncture point.
In electroacupuncture, an electrical current is applied to the needles once they are inserted, in order to further stimulate the respective acupuncture points. [http://en.wikipedia.org/wiki/Acupuncture]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1417'
       ,'1'
       ,'1'
       ,'1'
       ,'Herbal medicine'
       ,'In traditional Chinese medicine, there are roughly 13,000 medicinals used in China and over 100,000 medicinal recipes recorded in the ancient literature.[1] Plant elements and extracts are the most common elements used in medicines. In the classic Handbook of Traditional Drugs from 1941, 517 drugs were listed - 442 were plant parts, 45 were animal parts, and 30 were minerals.
Herbal medicine, as used in Traditional Chinese Medicine (TCM), came to widespread attention in the United States in the 1970s. At least 40 states in the United States license practitioners of Oriental medicine, and there are about 50 colleges of Oriental medicine in the United States today. [http://en.wikipedia.org/wiki/List_of_medicines_in_traditional_Chinese_medicine]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1418'
       ,'1'
       ,'1'
       ,'1'
       ,'Medical massage (Tui na)'
       ,'Tui na is a form of massage akin to acupressure (from which shiatsu evolved). Oriental massage is typically administered with the patient fully clothed, without the application of grease or oils. Choreography often involves thumb presses, rubbing, percussion, and stretches. [http://en.wikipedia.org/wiki/Tui_na]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1419'
       ,'1'
       ,'1'
       ,'1'
       ,'Cupping'
       ,'Cupping is a type of Chinese massage, consisting of placing several glass "cups" (open spheres) on the body. A match is lit and placed inside the cup and then removed before placing the cup against the skin. As the air in the cup is heated, it expands, and after placing in the skin, cools, creating lower pressure inside the cup that allows the cup to stick to the skin via suction. When combined with massage oil, the cups can be slid around the back, offering "reverse-pressure massage".[http://en.wikipedia.org/wiki/Traditional_Chinese_medicine#Cupping]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1420'
       ,'1'
       ,'1'
       ,'1'
       ,'Gua Sha'
       ,'Gua Sha is abrading the skin with pieces of smooth jade,
 bone,
 animal tusks or horns or smooth stones; until red spots then bruising cover the area to which it is done. It is believed that this treatment is for almost any ailment including cholera. The red spots and bruising take 3 to 10 days to heal,
 there is often some soreness in the area that has been treated. [http://en.wikipedia.org/wiki/Traditional_Chinese_medicine#Gua_Sha]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1421'
       ,'1'
       ,'1'
       ,'1'
       ,'Die-da'
       ,'Die-dá or bone-setting is usually practiced by martial artists who know aspects of Chinese medicine that apply to the treatment of trauma and injuries such as bone fractures, sprains, and bruises. Some of these specialists may also use or recommend other disciplines of Chinese medical therapies (or Western medicine in modern times) if serious injury is involved. Such practice of bone-setting is not common in the West. [http://en.wikipedia.org/wiki/Traditional_Chinese_medicine#Die-da]'
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1422'
       ,'1'
       ,'1'
       ,'1'
       ,'Chinese food therapy'
       ,'Chinese food therapy is a practice in the belief of healing through the use of natural foods instead of medications.
Chinese food or Nutrition therapy, is a modality of traditional Chinese medicine, as opposed to evidence-based medicine.
One of the central ideas in this belief system is that certain foods have a "hot" or heat inducing quality while others have a "cold" or chilling effect on one''s body, organs or "energy" levels. The idea being that one''s imbalance of natural "heat" and "cold" in a body can cause disease or be more conducive towards sickness. Although, in this belief system, it does not necessarily mean one''s internal "heat" or "cold" balance is directly related to being physically hot (to the point of sweating) or cold (feeling chilly from cold weather). [http://en.wikipedia.org/wiki/Chinese_food_therapy] '
       ,'1/23/2013 12:00:00 AM'
       ,'1/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1423'
       ,'1'
       ,'1'
       ,'1'
       ,'Abdominal pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1424'
       ,'1'
       ,'1'
       ,'1'
       ,'Acne'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1425'
       ,'1'
       ,'1'
       ,'1'
       ,'Alcohol addiction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1426'
       ,'1'
       ,'1'
       ,'1'
       ,'Allergies'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1427'
       ,'1'
       ,'1'
       ,'1'
       ,'Anxiety'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1428'
       ,'1'
       ,'1'
       ,'1'
       ,'Arthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1429'
       ,'1'
       ,'1'
       ,'1'
       ,'Asthma'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1430'
       ,'1'
       ,'1'
       ,'1'
       ,'Bell’s Palsy'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1431'
       ,'1'
       ,'1'
       ,'1'
       ,'Bladder/Kidney problems'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1432'
       ,'1'
       ,'1'
       ,'1'
       ,'Cancer pains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1433'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpal Tunnel Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1434'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemotherapy side effects'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1435'
       ,'1'
       ,'1'
       ,'1'
       ,'Colds & Flus'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1436'
       ,'1'
       ,'1'
       ,'1'
       ,'Constipation/Diarrhea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1437'
       ,'1'
       ,'1'
       ,'1'
       ,'Cough/Bronchitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1438'
       ,'1'
       ,'1'
       ,'1'
       ,'Depression'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1439'
       ,'1'
       ,'1'
       ,'1'
       ,'Diabetes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1440'
       ,'1'
       ,'1'
       ,'1'
       ,'Dizziness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1441'
       ,'1'
       ,'1'
       ,'1'
       ,'Dysentery'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1442'
       ,'1'
       ,'1'
       ,'1'
       ,'Earaches'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1443'
       ,'1'
       ,'1'
       ,'1'
       ,'Facial pains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1444'
       ,'1'
       ,'1'
       ,'1'
       ,'Facial spasms'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1445'
       ,'1'
       ,'1'
       ,'1'
       ,'Fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1446'
       ,'1'
       ,'1'
       ,'1'
       ,'Fertility'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1447'
       ,'1'
       ,'1'
       ,'1'
       ,'Fibromyalgia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1448'
       ,'1'
       ,'1'
       ,'1'
       ,'Gallstones'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1449'
       ,'1'
       ,'1'
       ,'1'
       ,'Gallbladder disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1450'
       ,'1'
       ,'1'
       ,'1'
       ,'Gastrointestinal disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1451'
       ,'1'
       ,'1'
       ,'1'
       ,'Gynecological disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1452'
       ,'1'
       ,'1'
       ,'1'
       ,'Headaches/Migraines'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1453'
       ,'1'
       ,'1'
       ,'1'
       ,'Heartburn'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1454'
       ,'1'
       ,'1'
       ,'1'
       ,'Herpes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1455'
       ,'1'
       ,'1'
       ,'1'
       ,'High blood pressure'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1456'
       ,'1'
       ,'1'
       ,'1'
       ,'High cholesterol'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1457'
       ,'1'
       ,'1'
       ,'1'
       ,'Insomnia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1458'
       ,'1'
       ,'1'
       ,'1'
       ,'Lactation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1459'
       ,'1'
       ,'1'
       ,'1'
       ,'Ménière Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1460'
       ,'1'
       ,'1'
       ,'1'
       ,'Menopausal Discomfort'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1461'
       ,'1'
       ,'1'
       ,'1'
       ,'Multiple Sclerosis (MS)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1462'
       ,'1'
       ,'1'
       ,'1'
       ,'Nausea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1463'
       ,'1'
       ,'1'
       ,'1'
       ,'Neck stiffness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1464'
       ,'1'
       ,'1'
       ,'1'
       ,'Neuralgia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1465'
       ,'1'
       ,'1'
       ,'1'
       ,'Surgery rehabilitation and healing'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1466'
       ,'1'
       ,'1'
       ,'1'
       ,'Back pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1467'
       ,'1'
       ,'1'
       ,'1'
       ,'Joint pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1468'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports injuries'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1469'
       ,'1'
       ,'1'
       ,'1'
       ,'Paralysis/Numbness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1470'
       ,'1'
       ,'1'
       ,'1'
       ,'Vaginal/Yeast infections'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1471'
       ,'1'
       ,'1'
       ,'1'
       ,'Poor concentration'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1472'
       ,'1'
       ,'1'
       ,'1'
       ,'Pregnancy-related disorders/discomforts'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1473'
       ,'1'
       ,'1'
       ,'1'
       ,'Morning sickness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1474'
       ,'1'
       ,'1'
       ,'1'
       ,'Hyperemesis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1475'
       ,'1'
       ,'1'
       ,'1'
       ,'Sciatica'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1476'
       ,'1'
       ,'1'
       ,'1'
       ,'Premenstrual Syndrome (PMS)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1477'
       ,'1'
       ,'1'
       ,'1'
       ,'Sexual dysfunction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1478'
       ,'1'
       ,'1'
       ,'1'
       ,'Sinusitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1479'
       ,'1'
       ,'1'
       ,'1'
       ,'Sjögren Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1480'
       ,'1'
       ,'1'
       ,'1'
       ,'Eczema'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1481'
       ,'1'
       ,'1'
       ,'1'
       ,'Psoriasis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1482'
       ,'1'
       ,'1'
       ,'1'
       ,'Hives'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1483'
       ,'1'
       ,'1'
       ,'1'
       ,'Dermatitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1484'
       ,'1'
       ,'1'
       ,'1'
       ,'Poison Ivy/Poison Oak'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1486'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoking addition'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1487'
       ,'1'
       ,'1'
       ,'1'
       ,'Sprains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1488'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress reduction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1489'
       ,'1'
       ,'1'
       ,'1'
       ,'Stroke'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1490'
       ,'1'
       ,'1'
       ,'1'
       ,'Temporomandibular Joint Dysfunction (TMJ)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1491'
       ,'1'
       ,'1'
       ,'1'
       ,'Tendonitis/Repetitive Stress Injury'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1492'
       ,'1'
       ,'1'
       ,'1'
       ,'Tennis Elbow'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1493'
       ,'1'
       ,'1'
       ,'1'
       ,'Urinary-Tract Infection'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1494'
       ,'1'
       ,'1'
       ,'1'
       ,'Vertigo'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1495'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight loss'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1496'
       ,'1'
       ,'1'
       ,'1'
       ,'Hot Flashes & Night Sweats'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1497'
       ,'1'
       ,'1'
       ,'1'
       ,'Dysmenorrhoea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1498'
       ,'1'
       ,'1'
       ,'1'
       ,'Polycystic Ovary Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1499'
       ,'1'
       ,'1'
       ,'1'
       ,'Endometriosis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1500'
       ,'1'
       ,'1'
       ,'1'
       ,'Fibroid Tumors/Uterine Myomas'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1501'
       ,'1'
       ,'1'
       ,'1'
       ,'Irregular periods'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1502'
       ,'1'
       ,'1'
       ,'1'
       ,'Osteoarthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1503'
       ,'1'
       ,'1'
       ,'1'
       ,'Rheumatoid Arthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1504'
       ,'1'
       ,'1'
       ,'1'
       ,'Drug addiction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1505'
       ,'1'
       ,'1'
       ,'1'
       ,'Irritable Bowel Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1506'
       ,'1'
       ,'1'
       ,'1'
       ,'Inflamatory Bowel Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1507'
       ,'1'
       ,'1'
       ,'1'
       ,'Chron''s Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1508'
       ,'1'
       ,'1'
       ,'1'
       ,'Ulcerative Colitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1509'
       ,'1'
       ,'1'
       ,'1'
       ,'Anemia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1510'
       ,'1'
       ,'1'
       ,'1'
       ,'Breech presentation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1511'
       ,'1'
       ,'1'
       ,'1'
       ,'Fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1512'
       ,'1'
       ,'1'
       ,'1'
       ,'Gestational diabetes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1513'
       ,'1'
       ,'1'
       ,'1'
       ,'Hemorrhoids'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1514'
       ,'1'
       ,'1'
       ,'1'
       ,'Hypertensive disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1515'
       ,'1'
       ,'1'
       ,'1'
       ,'Irregular contractions'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1516'
       ,'1'
       ,'1'
       ,'1'
       ,'Labor preparation/induction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1517'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutrition and lifestyle'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1518'
       ,'1'
       ,'1'
       ,'1'
       ,'Respiratory infections'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1519'
       ,'1'
       ,'1'
       ,'1'
       ,'Shortness of breath'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1520'
       ,'1'
       ,'1'
       ,'1'
       ,'Threatened miscarriage'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1521'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum blood loss'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1522'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum breast infection'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1523'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum Depression'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1524'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1525'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1526'
       ,'1'
       ,'1'
       ,'1'
       ,'Insufficient Lactation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1527'
       ,'1'
       ,'1'
       ,'1'
       ,'Hormone regulation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1528'
       ,'1'
       ,'1'
       ,'1'
       ,'Insomnia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1529'
       ,'1'
       ,'1'
       ,'1'
       ,'IVF/IUI support'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1530'
       ,'1'
       ,'1'
       ,'1'
       ,'Autoimmune disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1531'
       ,'1'
       ,'1'
       ,'1'
       ,'PCOS'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1532'
       ,'1'
       ,'1'
       ,'1'
       ,'Psychoemotional conditions'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'185')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1533'
       ,'1'
       ,'1'
       ,'1'
       ,'Life celebration parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1534'
       ,'1'
       ,'1'
       ,'1'
       ,'Short-term contract'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1535'
       ,'1'
       ,'1'
       ,'1'
       ,'Dinner parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1536'
       ,'1'
       ,'1'
       ,'1'
       ,'Cocktail parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1537'
       ,'1'
       ,'1'
       ,'1'
       ,'Bachelor/Bachelorette parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1538'
       ,'1'
       ,'1'
       ,'1'
       ,'Baby showers'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1539'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1540'
       ,'1'
       ,'1'
       ,'1'
       ,'Anniversary parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1541'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1542'
       ,'1'
       ,'1'
       ,'1'
       ,'Rehearsal dinners'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1543'
       ,'1'
       ,'1'
       ,'1'
       ,'Open houses'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1544'
       ,'1'
       ,'1'
       ,'1'
       ,'Romantic dinners'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1545'
       ,'1'
       ,'1'
       ,'1'
       ,'Picnic lunches'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1546'
       ,'1'
       ,'1'
       ,'1'
       ,'Coffee breaks'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1547'
       ,'1'
       ,'1'
       ,'1'
       ,'Prepared lunches/Lunchboxes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1548'
       ,'1'
       ,'1'
       ,'1'
       ,'Prepared dinners'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1549'
       ,'1'
       ,'1'
       ,'1'
       ,'Brunches'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1550'
       ,'1'
       ,'1'
       ,'1'
       ,'BBQs'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1551'
       ,'1'
       ,'1'
       ,'1'
       ,'Engagement parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1552'
       ,'1'
       ,'1'
       ,'1'
       ,'Black-tie dinners'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1553'
       ,'1'
       ,'1'
       ,'1'
       ,'Children''s parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1554'
       ,'1'
       ,'1'
       ,'1'
       ,'Food truck'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1555'
       ,'1'
       ,'1'
       ,'1'
       ,'African'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1556'
       ,'1'
       ,'1'
       ,'1'
       ,'Spanish'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1557'
       ,'1'
       ,'1'
       ,'1'
       ,'Tapas'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1558'
       ,'1'
       ,'1'
       ,'1'
       ,'French'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1559'
       ,'1'
       ,'1'
       ,'1'
       ,'Mexican'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1560'
       ,'1'
       ,'1'
       ,'1'
       ,'TexMex'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1561'
       ,'1'
       ,'1'
       ,'1'
       ,'Italian'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1562'
       ,'1'
       ,'1'
       ,'1'
       ,'Thai'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1563'
       ,'1'
       ,'1'
       ,'1'
       ,'Vietnamese'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1564'
       ,'1'
       ,'1'
       ,'1'
       ,'Chinese'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1565'
       ,'1'
       ,'1'
       ,'1'
       ,'Japanese'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1566'
       ,'1'
       ,'1'
       ,'1'
       ,'Indian'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1567'
       ,'1'
       ,'1'
       ,'1'
       ,'Creole'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1568'
       ,'1'
       ,'1'
       ,'1'
       ,'Comfort food'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1569'
       ,'1'
       ,'1'
       ,'1'
       ,'Brazilian '
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1570'
       ,'1'
       ,'1'
       ,'1'
       ,'California'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1571'
       ,'1'
       ,'1'
       ,'1'
       ,'Latin American'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1572'
       ,'1'
       ,'1'
       ,'1'
       ,'Fusion '
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1573'
       ,'1'
       ,'1'
       ,'1'
       ,'New American'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1574'
       ,'1'
       ,'1'
       ,'1'
       ,'Mediterranean'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1575'
       ,'1'
       ,'1'
       ,'1'
       ,'Middle Eastern'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1576'
       ,'1'
       ,'1'
       ,'1'
       ,'Kosher'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1577'
       ,'1'
       ,'1'
       ,'1'
       ,'Vegetarian'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1578'
       ,'1'
       ,'1'
       ,'1'
       ,'Vegan'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1579'
       ,'1'
       ,'1'
       ,'1'
       ,'Locally sourced ingredients'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1580'
       ,'1'
       ,'1'
       ,'1'
       ,'Organic ingredients'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1581'
       ,'1'
       ,'1'
       ,'1'
       ,'Gluten-free'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1582'
       ,'1'
       ,'1'
       ,'1'
       ,'Heart-healthy'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1583'
       ,'1'
       ,'1'
       ,'1'
       ,'Dietary restrictive ingredients'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1584'
       ,'1'
       ,'1'
       ,'1'
       ,'Grocery shopping'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1585'
       ,'1'
       ,'1'
       ,'1'
       ,'Ingredients'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1586'
       ,'1'
       ,'1'
       ,'1'
       ,'Cleanup'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1587'
       ,'1'
       ,'1'
       ,'1'
       ,'Table setting'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1588'
       ,'1'
       ,'1'
       ,'1'
       ,'China'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1589'
       ,'1'
       ,'1'
       ,'1'
       ,'Flatware'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1590'
       ,'1'
       ,'1'
       ,'1'
       ,'Cooking utensils/Pots & pans'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1591'
       ,'1'
       ,'1'
       ,'1'
       ,'Office parties'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'245')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1592'
       ,'1'
       ,'1'
       ,'1'
       ,'Structural Foot Balancing®'
       ,''
       ,'2/7/2013 12:00:00 AM'
       ,'2/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1593'
       ,'1'
       ,'1'
       ,'1'
       ,'Vibrational Healing Massage Therapy®'
       ,''
       ,'2/7/2013 12:00:00 AM'
       ,'2/7/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1594'
       ,'1'
       ,'1'
       ,'1'
       ,'Active Release Techniques (ART®)'
       ,'ART has been developed, refined, and patented by P. Michael Leahy, DC, CCSP. Dr. Leahy noticed that his patients'' symptoms seemed to be related to changes in their soft tissue that could be felt by hand. By observing how muscles, fascia, tendons, ligaments and nerves responded to different types of work, Dr. Leahy was able to consistently resolve over 90% of his patients'' problems. He now teaches and certifies health care providers all over the world to use ART. [http://www.activerelease.com/what_patients.asp]'
       ,'2/12/2013 12:00:00 AM'
       ,'2/12/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1596'
       ,'1'
       ,'1'
       ,'1'
       ,'Kitchen and bath design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1597'
       ,'1'
       ,'1'
       ,'1'
       ,'Space planning'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1598'
       ,'1'
       ,'1'
       ,'1'
       ,'Lighting design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1599'
       ,'1'
       ,'1'
       ,'1'
       ,'Color consultation'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1600'
       ,'1'
       ,'1'
       ,'1'
       ,'Interior architecture'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1601'
       ,'1'
       ,'1'
       ,'1'
       ,'Custom furniture'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1602'
       ,'1'
       ,'1'
       ,'1'
       ,'Furniture and finish selection'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1603'
       ,'1'
       ,'1'
       ,'1'
       ,'Office design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1604'
       ,'1'
       ,'1'
       ,'1'
       ,'Restaurant design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1605'
       ,'1'
       ,'1'
       ,'1'
       ,'Hotel design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1606'
       ,'1'
       ,'1'
       ,'1'
       ,'CAD drawings'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1607'
       ,'1'
       ,'1'
       ,'1'
       ,'3D modeling'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1608'
       ,'1'
       ,'1'
       ,'1'
       ,'Project management'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1609'
       ,'1'
       ,'1'
       ,'1'
       ,'Flooring design'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1610'
       ,'1'
       ,'1'
       ,'1'
       ,'Window treatments'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1611'
       ,'1'
       ,'1'
       ,'1'
       ,'Retail'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1612'
       ,'1'
       ,'1'
       ,'1'
       ,'Modern'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1613'
       ,'1'
       ,'1'
       ,'1'
       ,'Minimalistic'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1614'
       ,'1'
       ,'1'
       ,'1'
       ,'Contemporary'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1615'
       ,'1'
       ,'1'
       ,'1'
       ,'Traditional'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1616'
       ,'1'
       ,'1'
       ,'1'
       ,'Industrial'
       ,''
       ,'2/14/2013 12:00:00 AM'
       ,'2/14/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'132')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1617'
       ,'1'
       ,'1'
       ,'1'
       ,'Western clinical'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1618'
       ,'1'
       ,'1'
       ,'1'
       ,'Traditional Ayurvedic Medicine'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1619'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutritional counseling'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1620'
       ,'1'
       ,'1'
       ,'1'
       ,'Emotional Energetic counseling'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1621'
       ,'1'
       ,'1'
       ,'1'
       ,'Flower essence therapy'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1622'
       ,'1'
       ,'1'
       ,'1'
       ,'Traditional folk medicine'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1623'
       ,'1'
       ,'1'
       ,'1'
       ,'Apothecary (medicine/herbal remedies maker)'
       ,''
       ,'2/26/2013 12:00:00 AM'
       ,'2/26/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1624'
       ,'1'
       ,'1'
       ,'1'
       ,'Abdominal pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1625'
       ,'1'
       ,'1'
       ,'1'
       ,'Acne'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1626'
       ,'1'
       ,'1'
       ,'1'
       ,'Alcohol addiction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1627'
       ,'1'
       ,'1'
       ,'1'
       ,'Allergies'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1628'
       ,'1'
       ,'1'
       ,'1'
       ,'Anxiety'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1629'
       ,'1'
       ,'1'
       ,'1'
       ,'Arthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1630'
       ,'1'
       ,'1'
       ,'1'
       ,'Asthma'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1631'
       ,'1'
       ,'1'
       ,'1'
       ,'Bell’s Palsy'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1632'
       ,'1'
       ,'1'
       ,'1'
       ,'Bladder/Kidney problems'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1633'
       ,'1'
       ,'1'
       ,'1'
       ,'Cancer pains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1634'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpal Tunnel Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1635'
       ,'1'
       ,'1'
       ,'1'
       ,'Chemotherapy side effects'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1636'
       ,'1'
       ,'1'
       ,'1'
       ,'Colds & Flus'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1637'
       ,'1'
       ,'1'
       ,'1'
       ,'Constipation/Diarrhea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1638'
       ,'1'
       ,'1'
       ,'1'
       ,'Cough/Bronchitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1639'
       ,'1'
       ,'1'
       ,'1'
       ,'Depression'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1640'
       ,'1'
       ,'1'
       ,'1'
       ,'Diabetes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1641'
       ,'1'
       ,'1'
       ,'1'
       ,'Dizziness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1642'
       ,'1'
       ,'1'
       ,'1'
       ,'Dysentery'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1643'
       ,'1'
       ,'1'
       ,'1'
       ,'Earaches'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1644'
       ,'1'
       ,'1'
       ,'1'
       ,'Facial pains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1645'
       ,'1'
       ,'1'
       ,'1'
       ,'Facial spasms'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1646'
       ,'1'
       ,'1'
       ,'1'
       ,'Fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1647'
       ,'1'
       ,'1'
       ,'1'
       ,'Fertility'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1648'
       ,'1'
       ,'1'
       ,'1'
       ,'Fibromyalgia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1649'
       ,'1'
       ,'1'
       ,'1'
       ,'Gallstones'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1650'
       ,'1'
       ,'1'
       ,'1'
       ,'Gallbladder disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1651'
       ,'1'
       ,'1'
       ,'1'
       ,'Gastrointestinal disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1652'
       ,'1'
       ,'1'
       ,'1'
       ,'Gynecological disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1653'
       ,'1'
       ,'1'
       ,'1'
       ,'Headaches/Migraines'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1654'
       ,'1'
       ,'1'
       ,'1'
       ,'Heartburn'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1655'
       ,'1'
       ,'1'
       ,'1'
       ,'Herpes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1656'
       ,'1'
       ,'1'
       ,'1'
       ,'High blood pressure'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1657'
       ,'1'
       ,'1'
       ,'1'
       ,'High cholesterol'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1658'
       ,'1'
       ,'1'
       ,'1'
       ,'Insomnia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1659'
       ,'1'
       ,'1'
       ,'1'
       ,'Lactation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1660'
       ,'1'
       ,'1'
       ,'1'
       ,'Ménière Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1661'
       ,'1'
       ,'1'
       ,'1'
       ,'Menopausal Discomfort'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1662'
       ,'1'
       ,'1'
       ,'1'
       ,'Multiple Sclerosis (MS)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1663'
       ,'1'
       ,'1'
       ,'1'
       ,'Nausea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1664'
       ,'1'
       ,'1'
       ,'1'
       ,'Neck stiffness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1665'
       ,'1'
       ,'1'
       ,'1'
       ,'Neuralgia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1666'
       ,'1'
       ,'1'
       ,'1'
       ,'Surgery rehabilitation and healing'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1667'
       ,'1'
       ,'1'
       ,'1'
       ,'Back pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1668'
       ,'1'
       ,'1'
       ,'1'
       ,'Joint pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1669'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports injuries'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1670'
       ,'1'
       ,'1'
       ,'1'
       ,'Paralysis/Numbness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1671'
       ,'1'
       ,'1'
       ,'1'
       ,'Vaginal/Yeast infections'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1672'
       ,'1'
       ,'1'
       ,'1'
       ,'Poor concentration'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1673'
       ,'1'
       ,'1'
       ,'1'
       ,'Pregnancy-related disorders/discomforts'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1674'
       ,'1'
       ,'1'
       ,'1'
       ,'Morning sickness'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1675'
       ,'1'
       ,'1'
       ,'1'
       ,'Hyperemesis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1676'
       ,'1'
       ,'1'
       ,'1'
       ,'Sciatica'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1677'
       ,'1'
       ,'1'
       ,'1'
       ,'Premenstrual Syndrome (PMS)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1678'
       ,'1'
       ,'1'
       ,'1'
       ,'Sexual dysfunction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1679'
       ,'1'
       ,'1'
       ,'1'
       ,'Sinusitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1680'
       ,'1'
       ,'1'
       ,'1'
       ,'Sjögren Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1681'
       ,'1'
       ,'1'
       ,'1'
       ,'Eczema'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1682'
       ,'1'
       ,'1'
       ,'1'
       ,'Psoriasis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1683'
       ,'1'
       ,'1'
       ,'1'
       ,'Hives'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1684'
       ,'1'
       ,'1'
       ,'1'
       ,'Dermatitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1685'
       ,'1'
       ,'1'
       ,'1'
       ,'Poison Ivy/Poison Oak'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1686'
       ,'1'
       ,'1'
       ,'1'
       ,'Smoking addition'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1687'
       ,'1'
       ,'1'
       ,'1'
       ,'Sprains'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1688'
       ,'1'
       ,'1'
       ,'1'
       ,'Stress reduction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1689'
       ,'1'
       ,'1'
       ,'1'
       ,'Stroke'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1690'
       ,'1'
       ,'1'
       ,'1'
       ,'Temporomandibular Joint Dysfunction (TMJ)'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1691'
       ,'1'
       ,'1'
       ,'1'
       ,'Tendonitis/Repetitive Stress Injury'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1692'
       ,'1'
       ,'1'
       ,'1'
       ,'Tennis Elbow'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1693'
       ,'1'
       ,'1'
       ,'1'
       ,'Urinary-Tract Infection'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1694'
       ,'1'
       ,'1'
       ,'1'
       ,'Vertigo'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1695'
       ,'1'
       ,'1'
       ,'1'
       ,'Weight loss'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1696'
       ,'1'
       ,'1'
       ,'1'
       ,'Hot Flashes & Night Sweats'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1697'
       ,'1'
       ,'1'
       ,'1'
       ,'Dysmenorrhoea'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1698'
       ,'1'
       ,'1'
       ,'1'
       ,'Polycystic Ovary Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1699'
       ,'1'
       ,'1'
       ,'1'
       ,'Endometriosis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1700'
       ,'1'
       ,'1'
       ,'1'
       ,'Fibroid Tumors/Uterine Myomas'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1701'
       ,'1'
       ,'1'
       ,'1'
       ,'Irregular periods'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1702'
       ,'1'
       ,'1'
       ,'1'
       ,'Osteoarthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1703'
       ,'1'
       ,'1'
       ,'1'
       ,'Rheumatoid Arthritis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1704'
       ,'1'
       ,'1'
       ,'1'
       ,'Drug addiction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1705'
       ,'1'
       ,'1'
       ,'1'
       ,'Irritable Bowel Syndrome'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1706'
       ,'1'
       ,'1'
       ,'1'
       ,'Inflamatory Bowel Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1707'
       ,'1'
       ,'1'
       ,'1'
       ,'Chron''s Disease'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1708'
       ,'1'
       ,'1'
       ,'1'
       ,'Ulcerative Colitis'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1709'
       ,'1'
       ,'1'
       ,'1'
       ,'Anemia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1710'
       ,'1'
       ,'1'
       ,'1'
       ,'Breech presentation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1711'
       ,'1'
       ,'1'
       ,'1'
       ,'Fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1712'
       ,'1'
       ,'1'
       ,'1'
       ,'Gestational diabetes'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1713'
       ,'1'
       ,'1'
       ,'1'
       ,'Hemorrhoids'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1714'
       ,'1'
       ,'1'
       ,'1'
       ,'Hypertensive disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1715'
       ,'1'
       ,'1'
       ,'1'
       ,'Irregular contractions'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1716'
       ,'1'
       ,'1'
       ,'1'
       ,'Labor preparation/induction'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1717'
       ,'1'
       ,'1'
       ,'1'
       ,'Nutrition and lifestyle'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1718'
       ,'1'
       ,'1'
       ,'1'
       ,'Respiratory infections'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1719'
       ,'1'
       ,'1'
       ,'1'
       ,'Shortness of breath'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1720'
       ,'1'
       ,'1'
       ,'1'
       ,'Threatened miscarriage'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1721'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum blood loss'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1722'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum breast infection'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1723'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum Depression'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1724'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum fatigue'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1725'
       ,'1'
       ,'1'
       ,'1'
       ,'Post-partum pain'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1726'
       ,'1'
       ,'1'
       ,'1'
       ,'Insufficient Lactation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1727'
       ,'1'
       ,'1'
       ,'1'
       ,'Hormone regulation'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1728'
       ,'1'
       ,'1'
       ,'1'
       ,'Insomnia'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1729'
       ,'1'
       ,'1'
       ,'1'
       ,'IVF/IUI support'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1730'
       ,'1'
       ,'1'
       ,'1'
       ,'Autoimmune disorders'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1731'
       ,'1'
       ,'1'
       ,'1'
       ,'PCOS'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1732'
       ,'1'
       ,'1'
       ,'1'
       ,'Psychoemotional conditions'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1733'
       ,'1'
       ,'1'
       ,'1'
       ,'Trans health'
       ,''
       ,'2/6/2013 12:00:00 AM'
       ,'2/6/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'287')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1734'
       ,'1'
       ,'1'
       ,'1'
       ,'Planting'
       ,''
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1735'
       ,'1'
       ,'1'
       ,'1'
       ,'Landscape design'
       ,''
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'22')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1736'
       ,'1'
       ,'1'
       ,'1'
       ,'G & J tube feeding'
       ,''
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1737'
       ,'1'
       ,'1'
       ,'1'
       ,'G & J tube drainage'
       ,''
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'27')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1738'
       ,'1'
       ,'1'
       ,'1'
       ,'Craniosacral'
       ,'The therapist lightly palpates the patient''s body, and focuses intently on the communicated movements. A practitioner''s feeling of being in tune with a patient is described as entrainment. Patients often report feelings of deep relaxation during and after the treatment session, and may feel light-headed. This is popularly associated with increases in endorphins, but research shows the effects may actually be brought about by the endocannabinoid system. [http://en.wikipedia.org/wiki/Craniosacral_therapy]'
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1739'
       ,'1'
       ,'1'
       ,'1'
       ,'Sports'
       ,''
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1740'
       ,'1'
       ,'1'
       ,'1'
       ,'Tui-na'
       ,'The practitioner may brush, knead, roll/press, and rub the areas between each of the joints, known as the eight gates, to attempt to open the body''s defensive (wei) chi and get the energy moving in the meridians and the muscles. The practitioner can then use range of motion, traction, and massage, with the stimulation of acupressure points. These techniques are claimed to aid in the treatment of both acute and chronic musculoskeletal conditions, as well as many non-musculoskeletal conditions. [http://en.wikipedia.org/wiki/Tui_na]'
       ,'3/18/2013 12:00:00 AM'
       ,'3/18/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1741'
       ,'1'
       ,'1'
       ,'1'
       ,'Pre/Perinatal'
       ,''
       ,'4/1/2013 12:00:00 AM'
       ,'4/1/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'106')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1742'
       ,'1'
       ,'1'
       ,'1'
       ,'Women''s long haircut (below shoulders)'
       ,NULL
       ,'4/9/2013 12:00:00 AM'
       ,'4/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'36')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1743'
       ,'1'
       ,'1'
       ,'1'
       ,'Application essay writing support'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1744'
       ,'1'
       ,'1'
       ,'1'
       ,'Pre-writing/Idea organization '
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1745'
       ,'1'
       ,'1'
       ,'1'
       ,'Writing your first draft assistance'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1746'
       ,'1'
       ,'1'
       ,'1'
       ,'Writing structure and organization'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1747'
       ,'1'
       ,'1'
       ,'1'
       ,'Revising and editing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1748'
       ,'1'
       ,'1'
       ,'1'
       ,'Publishing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1749'
       ,'1'
       ,'1'
       ,'1'
       ,'Blog posting'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1750'
       ,'1'
       ,'1'
       ,'1'
       ,'Time management '
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1751'
       ,'1'
       ,'1'
       ,'1'
       ,'Web content'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1752'
       ,'1'
       ,'1'
       ,'1'
       ,'Grant writing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1753'
       ,'1'
       ,'1'
       ,'1'
       ,'Resume'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1754'
       ,'1'
       ,'1'
       ,'1'
       ,'Speech writing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1755'
       ,'1'
       ,'1'
       ,'1'
       ,'Technical communications'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1756'
       ,'1'
       ,'1'
       ,'1'
       ,'Academic '
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'288')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1757'
       ,'1'
       ,'1'
       ,'1'
       ,'Application essays'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1758'
       ,'1'
       ,'1'
       ,'1'
       ,'Pre-writing/Idea organization '
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1759'
       ,'1'
       ,'1'
       ,'1'
       ,'Writing your first draft'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1760'
       ,'1'
       ,'1'
       ,'1'
       ,'Writing structure and organization'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1761'
       ,'1'
       ,'1'
       ,'1'
       ,'Revising and editing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1762'
       ,'1'
       ,'1'
       ,'1'
       ,'Publishing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1763'
       ,'1'
       ,'1'
       ,'1'
       ,'Blog posting'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1764'
       ,'1'
       ,'1'
       ,'1'
       ,'Time management '
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1765'
       ,'1'
       ,'1'
       ,'1'
       ,'Web content'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1766'
       ,'1'
       ,'1'
       ,'1'
       ,'Grant writing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1767'
       ,'1'
       ,'1'
       ,'1'
       ,'Ghostwriting'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1768'
       ,'1'
       ,'1'
       ,'1'
       ,'Resume'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1769'
       ,'1'
       ,'1'
       ,'1'
       ,'Speech writing'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1770'
       ,'1'
       ,'1'
       ,'1'
       ,'Technical communications'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1771'
       ,'1'
       ,'1'
       ,'1'
       ,'Academic'
       ,''
       ,'4/23/2013 12:00:00 AM'
       ,'4/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'289')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1772'
       ,'1'
       ,'1'
       ,'1'
       ,'Gutter repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1773'
       ,'1'
       ,'1'
       ,'1'
       ,'Gutter cleaning'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1774'
       ,'1'
       ,'1'
       ,'1'
       ,'Carpentry'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1775'
       ,'1'
       ,'1'
       ,'1'
       ,'Drywall repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1776'
       ,'1'
       ,'1'
       ,'1'
       ,'Drywall installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1777'
       ,'1'
       ,'1'
       ,'1'
       ,'Fence repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1778'
       ,'1'
       ,'1'
       ,'1'
       ,'Fence installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1779'
       ,'1'
       ,'1'
       ,'1'
       ,'Deck repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1780'
       ,'1'
       ,'1'
       ,'1'
       ,'Door repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1781'
       ,'1'
       ,'1'
       ,'1'
       ,'Door installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1782'
       ,'1'
       ,'1'
       ,'1'
       ,'Tile grouting'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1783'
       ,'1'
       ,'1'
       ,'1'
       ,'Window/door weather-proofing'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1784'
       ,'1'
       ,'1'
       ,'1'
       ,'Shelf installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1785'
       ,'1'
       ,'1'
       ,'1'
       ,'Leaky faucet repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1786'
       ,'1'
       ,'1'
       ,'1'
       ,'Drain cleaning/repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1787'
       ,'1'
       ,'1'
       ,'1'
       ,'Toilet repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1788'
       ,'1'
       ,'1'
       ,'1'
       ,'Toilet installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1789'
       ,'1'
       ,'1'
       ,'1'
       ,'Leak repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1790'
       ,'1'
       ,'1'
       ,'1'
       ,'Shower/bathtub repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1791'
       ,'1'
       ,'1'
       ,'1'
       ,'Faucet installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1792'
       ,'1'
       ,'1'
       ,'1'
       ,'Faucet repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1793'
       ,'1'
       ,'1'
       ,'1'
       ,'Garbage disposal repair'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1794'
       ,'1'
       ,'1'
       ,'1'
       ,'Water heater installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1795'
       ,'1'
       ,'1'
       ,'1'
       ,'Sewer main repairs'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1796'
       ,'1'
       ,'1'
       ,'1'
       ,'Sewer main cleaning'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1797'
       ,'1'
       ,'1'
       ,'1'
       ,'Water line installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1798'
       ,'1'
       ,'1'
       ,'1'
       ,'Water line repairs'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1799'
       ,'1'
       ,'1'
       ,'1'
       ,'Gas line installation'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1800'
       ,'1'
       ,'1'
       ,'1'
       ,'Gas line repairs'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'40')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1801'
       ,'1'
       ,'1'
       ,'1'
       ,'Interior painting'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1802'
       ,'1'
       ,'1'
       ,'1'
       ,'Exterior Painting'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1803'
       ,'1'
       ,'1'
       ,'1'
       ,'Basic Painting'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1804'
       ,'1'
       ,'1'
       ,'1'
       ,'Walls '
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1805'
       ,'1'
       ,'1'
       ,'1'
       ,'Ceiling'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1806'
       ,'1'
       ,'1'
       ,'1'
       ,'Doors'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1807'
       ,'1'
       ,'1'
       ,'1'
       ,'Trim'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1808'
       ,'1'
       ,'1'
       ,'1'
       ,'Cabinets/wood'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'44')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1809'
       ,'1'
       ,'1'
       ,'1'
       ,'Qualitative research'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1810'
       ,'1'
       ,'1'
       ,'1'
       ,'Quantitative research'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1811'
       ,'1'
       ,'1'
       ,'1'
       ,'U&A studies'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1812'
       ,'1'
       ,'1'
       ,'1'
       ,'Concept tests'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1813'
       ,'1'
       ,'1'
       ,'1'
       ,'Create user research protocols for recruiting and/or screening'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1814'
       ,'1'
       ,'1'
       ,'1'
       ,'Lay groundwork for development of user testing panels'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1815'
       ,'1'
       ,'1'
       ,'1'
       ,'Research agency work'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1816'
       ,'1'
       ,'1'
       ,'1'
       ,'Hands-on client side work'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1817'
       ,'1'
       ,'1'
       ,'1'
       ,'Interviewing research participants'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'290')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1818'
       ,'1'
       ,'1'
       ,'1'
       ,'Visual design'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1819'
       ,'1'
       ,'1'
       ,'1'
       ,'Information architecture'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1820'
       ,'1'
       ,'1'
       ,'1'
       ,'Interaction design'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1821'
       ,'1'
       ,'1'
       ,'1'
       ,'Usability'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1822'
       ,'1'
       ,'1'
       ,'1'
       ,'Site Audit'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1823'
       ,'1'
       ,'1'
       ,'1'
       ,'Flows and navigation maps'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1824'
       ,'1'
       ,'1'
       ,'1'
       ,'Wireframes'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1825'
       ,'1'
       ,'1'
       ,'1'
       ,'Prototypes'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1826'
       ,'1'
       ,'1'
       ,'1'
       ,'Graphic mockups'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1827'
       ,'1'
       ,'1'
       ,'1'
       ,'User scenarios'
       ,''
       ,'7/23/2013 12:00:00 AM'
       ,'7/23/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'291')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1828'
       ,'1'
       ,'1'
       ,'1'
       ,'Schedule appointments and meetings'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1829'
       ,'1'
       ,'1'
       ,'1'
       ,'Handle phone, mail, and e-mail correspondence'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1830'
       ,'1'
       ,'1'
       ,'1'
       ,'Note-taking'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1831'
       ,'1'
       ,'1'
       ,'1'
       ,'Arrange and book travel'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1832'
       ,'1'
       ,'1'
       ,'1'
       ,'Errands'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1833'
       ,'1'
       ,'1'
       ,'1'
       ,'Shopping'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1834'
       ,'1'
       ,'1'
       ,'1'
       ,'Bookkeeping'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'53')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1835'
       ,'1'
       ,'1'
       ,'1'
       ,'Interior Painting'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1836'
       ,'1'
       ,'1'
       ,'1'
       ,'Exterior Painting'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1837'
       ,'1'
       ,'1'
       ,'1'
       ,'Electrical Repair/Troubleshooting'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1838'
       ,'1'
       ,'1'
       ,'1'
       ,'Electrical Installation'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1839'
       ,'1'
       ,'1'
       ,'1'
       ,'Plumbing Repair (Leaks/Clogged Drains)'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1840'
       ,'1'
       ,'1'
       ,'1'
       ,'Plumbing Piping/Installation'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1841'
       ,'1'
       ,'1'
       ,'1'
       ,'Flooring- tiles'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1842'
       ,'1'
       ,'1'
       ,'1'
       ,'Flooring -lamination'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1843'
       ,'1'
       ,'1'
       ,'1'
       ,'Ground keeping/cleaning/power-washing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1844'
       ,'1'
       ,'1'
       ,'1'
       ,'Yard work'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1845'
       ,'1'
       ,'1'
       ,'1'
       ,'Pick up and dump'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1846'
       ,'1'
       ,'1'
       ,'1'
       ,'Metal scrap/Recycling pick up'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1847'
       ,'1'
       ,'1'
       ,'1'
       ,'Hardwood floors'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1848'
       ,'1'
       ,'1'
       ,'1'
       ,'Window washing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1849'
       ,'1'
       ,'1'
       ,'1'
       ,'Garage custom shelving'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1850'
       ,'1'
       ,'1'
       ,'1'
       ,'Custom outdoor cabinetry and storage'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1851'
       ,'1'
       ,'1'
       ,'1'
       ,'Chicken enclosure'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1852'
       ,'1'
       ,'1'
       ,'1'
       ,'Tailoring/customization'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'210')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1853'
       ,'1'
       ,'1'
       ,'1'
       ,'Garment construction'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'210')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1854'
       ,'1'
       ,'1'
       ,'1'
       ,'Pattern-making'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'210')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1855'
       ,'1'
       ,'1'
       ,'1'
       ,'Mat classes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'281')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1856'
       ,'1'
       ,'1'
       ,'1'
       ,'Reformer classes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'281')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1857'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal training'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'281')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1858'
       ,'1'
       ,'1'
       ,'1'
       ,'Pilates for seniors'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'281')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1859'
       ,'1'
       ,'1'
       ,'1'
       ,'Cadillac classes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'281')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1860'
       ,'1'
       ,'1'
       ,'1'
       ,'Room-by-room space planning and organization'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'282')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1861'
       ,'1'
       ,'1'
       ,'1'
       ,'Management of paperwork and computer files'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'282')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1862'
       ,'1'
       ,'1'
       ,'1'
       ,'Goal setting and coaching'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'282')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1863'
       ,'1'
       ,'1'
       ,'1'
       ,'Time management coaching'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'282')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1864'
       ,'1'
       ,'1'
       ,'1'
       ,'Financial records management'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'282')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1865'
       ,'1'
       ,'1'
       ,'1'
       ,'French bread'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1866'
       ,'1'
       ,'1'
       ,'1'
       ,'Rye bread'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1867'
       ,'1'
       ,'1'
       ,'1'
       ,'Pita'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1868'
       ,'1'
       ,'1'
       ,'1'
       ,'Bagels'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1869'
       ,'1'
       ,'1'
       ,'1'
       ,'Cookies'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1870'
       ,'1'
       ,'1'
       ,'1'
       ,'Biscuits'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1871'
       ,'1'
       ,'1'
       ,'1'
       ,'Crackers'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1872'
       ,'1'
       ,'1'
       ,'1'
       ,'Cupcakes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1873'
       ,'1'
       ,'1'
       ,'1'
       ,'Coffee cakes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1874'
       ,'1'
       ,'1'
       ,'1'
       ,'Birthday cakes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1875'
       ,'1'
       ,'1'
       ,'1'
       ,'Wedding cakes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'92')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1876'
       ,'1'
       ,'1'
       ,'1'
       ,'Voice healing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1877'
       ,'1'
       ,'1'
       ,'1'
       ,'Personal coaching'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1878'
       ,'1'
       ,'1'
       ,'1'
       ,'Group classes'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1879'
       ,'1'
       ,'1'
       ,'1'
       ,'Tuning fork treatments'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1880'
       ,'1'
       ,'1'
       ,'1'
       ,'Performance techniques for singers'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1881'
       ,'1'
       ,'1'
       ,'1'
       ,'Leading chants and mantras'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1882'
       ,'1'
       ,'1'
       ,'1'
       ,'Voice analysis'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'285')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1883'
       ,'1'
       ,'1'
       ,'1'
       ,'Small events'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1884'
       ,'1'
       ,'1'
       ,'1'
       ,'Large events'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1885'
       ,'1'
       ,'1'
       ,'1'
       ,'Office meetings'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1886'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1887'
       ,'1'
       ,'1'
       ,'1'
       ,'Food truck'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1888'
       ,'1'
       ,'1'
       ,'1'
       ,'Box lunches'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1889'
       ,'1'
       ,'1'
       ,'1'
       ,'Furniture rentals'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1890'
       ,'1'
       ,'1'
       ,'1'
       ,'Hors d''oeuvres'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1891'
       ,'1'
       ,'1'
       ,'1'
       ,'American cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1892'
       ,'1'
       ,'1'
       ,'1'
       ,'Chinese cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1893'
       ,'1'
       ,'1'
       ,'1'
       ,'Indian cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1894'
       ,'1'
       ,'1'
       ,'1'
       ,'Japanese cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1895'
       ,'1'
       ,'1'
       ,'1'
       ,'Vietnamese cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1896'
       ,'1'
       ,'1'
       ,'1'
       ,'Filipino cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1897'
       ,'1'
       ,'1'
       ,'1'
       ,'Mexican cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1898'
       ,'1'
       ,'1'
       ,'1'
       ,'Argentinian cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1899'
       ,'1'
       ,'1'
       ,'1'
       ,'Ethiopian cuisine'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'72')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1900'
       ,'1'
       ,'1'
       ,'1'
       ,'Web content'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1901'
       ,'1'
       ,'1'
       ,'1'
       ,'Copy editing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1902'
       ,'1'
       ,'1'
       ,'1'
       ,'Advertising copywriting'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1903'
       ,'1'
       ,'1'
       ,'1'
       ,'Blogging'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1904'
       ,'1'
       ,'1'
       ,'1'
       ,'E-mail marketing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1905'
       ,'1'
       ,'1'
       ,'1'
       ,'Press releases'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1906'
       ,'1'
       ,'1'
       ,'1'
       ,'Legal writing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'222')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1907'
       ,'1'
       ,'1'
       ,'1'
       ,'Theory'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1908'
       ,'1'
       ,'1'
       ,'1'
       ,'Reading musical notation'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1909'
       ,'1'
       ,'1'
       ,'1'
       ,'Rock'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1910'
       ,'1'
       ,'1'
       ,'1'
       ,'Funk'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1911'
       ,'1'
       ,'1'
       ,'1'
       ,'Punk'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1912'
       ,'1'
       ,'1'
       ,'1'
       ,'Jazz'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1913'
       ,'1'
       ,'1'
       ,'1'
       ,'Swing'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1914'
       ,'1'
       ,'1'
       ,'1'
       ,'Ska'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1915'
       ,'1'
       ,'1'
       ,'1'
       ,'Reggae'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1916'
       ,'1'
       ,'1'
       ,'1'
       ,'Metal'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1917'
       ,'1'
       ,'1'
       ,'1'
       ,'Afro-Cuban'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'275')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1918'
       ,'1'
       ,'1'
       ,'1'
       ,'Delivery'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1919'
       ,'1'
       ,'1'
       ,'1'
       ,'Bouquets'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1920'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1921'
       ,'1'
       ,'1'
       ,'1'
       ,'Weddings'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1922'
       ,'1'
       ,'1'
       ,'1'
       ,'Church décor'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1923'
       ,'1'
       ,'1'
       ,'1'
       ,'Rare flowers'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'128')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1924'
       ,'1'
       ,'1'
       ,'1'
       ,'Theater productions'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1925'
       ,'1'
       ,'1'
       ,'1'
       ,'Dance productions'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1926'
       ,'1'
       ,'1'
       ,'1'
       ,'Music concerts'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1927'
       ,'1'
       ,'1'
       ,'1'
       ,'Art installations'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1928'
       ,'1'
       ,'1'
       ,'1'
       ,'Corporate events'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1929'
       ,'1'
       ,'1'
       ,'1'
       ,'Arena productions'
       ,''
       ,'8/2/2013 12:00:00 AM'
       ,'8/2/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'286')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1930'
       ,'1'
       ,'1'
       ,'1'
       ,'Repair/Remodel cost estimation'
       ,''
       ,'8/9/2013 12:00:00 AM'
       ,'8/9/2013 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1931'
       ,'1'
       ,'1'
       ,'1'
       ,'Mount flat screen TVs'
       ,''
       ,'1/31/2014 12:00:00 AM'
       ,'1/31/2014 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1932'
       ,'1'
       ,'1'
       ,'1'
       ,'Hang light fixtures'
       ,''
       ,'1/31/2014 12:00:00 AM'
       ,'1/31/2014 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1933'
       ,'1'
       ,'1'
       ,'1'
       ,'Install curtain rods'
       ,''
       ,'1/31/2014 12:00:00 AM'
       ,'1/31/2014 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1934'
       ,'1'
       ,'1'
       ,'1'
       ,'Hang artwork'
       ,''
       ,'1/31/2014 12:00:00 AM'
       ,'1/31/2014 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'82')
INSERT INTO [serviceattribute]
       ([ServiceAttributeID]
       ,[LanguageID]
       ,[CountryID]
       ,[SourceID]
       ,[Name]
       ,[ServiceAttributeDescription]
       ,[CreateDate]
       ,[UpdatedDate]
       ,[ModifiedBy]
       ,[Active]
       ,[DisplayRank]
       ,[PositionReference])
 VALUES
       ('1935'
       ,'1'
       ,'1'
       ,'1'
       ,'Bio-feedback'
       ,''
       ,'6/3/2014 12:00:00 AM'
       ,'6/3/2014 12:00:00 AM'
       ,'jd'
       ,'True'
       ,'1'
       ,'193')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
