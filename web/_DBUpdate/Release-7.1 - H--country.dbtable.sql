
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM country 
INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('1'
    ,'1'
    ,'United States'
    ,'USA'
    ,'US'
    ,'1'
    ,'4/14/2012 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'840')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('1'
    ,'2'
    ,'Estados Unidos'
    ,'USA'
    ,'US'
    ,'1'
    ,'4/14/2012 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'840')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('2'
    ,'1'
    ,'Spain'
    ,'ESP'
    ,'ES'
    ,'34'
    ,'4/14/2012 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'724')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('2'
    ,'2'
    ,'España'
    ,'ESP'
    ,'ES'
    ,'34'
    ,'4/14/2012 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'724')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('3'
    ,'1'
    ,'Afghanistan'
    ,'AFG'
    ,'AF'
    ,'93'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'4')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('4'
    ,'1'
    ,'Albania'
    ,'ALB'
    ,'AL'
    ,'355'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'8')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('5'
    ,'1'
    ,'Algeria'
    ,'DZA'
    ,'DZ'
    ,'213'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'12')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('6'
    ,'1'
    ,'American Samoa'
    ,'ASM'
    ,'AS'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'16')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('7'
    ,'1'
    ,'Andorra'
    ,'AND'
    ,'AD'
    ,'376'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'20')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('8'
    ,'1'
    ,'Angola'
    ,'AGO'
    ,'AO'
    ,'244'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'24')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('9'
    ,'1'
    ,'Anguilla'
    ,'AIA'
    ,'AI'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'660')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('10'
    ,'1'
    ,'Antarctica'
    ,' '
    ,'AQ'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('11'
    ,'1'
    ,'Antigua and Barbuda'
    ,'ATG'
    ,'AG'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'28')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('12'
    ,'1'
    ,'Argentina'
    ,'ARG'
    ,'AR'
    ,'54'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'32')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('13'
    ,'1'
    ,'Armenia'
    ,'ARM'
    ,'AM'
    ,'374'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'51')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('14'
    ,'1'
    ,'Aruba'
    ,'ABW'
    ,'AW'
    ,'297'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'533')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('15'
    ,'1'
    ,'Australia'
    ,'AUS'
    ,'AU'
    ,'61'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'36')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('16'
    ,'1'
    ,'Austria'
    ,'AUT'
    ,'AT'
    ,'43'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'40')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('17'
    ,'1'
    ,'Azerbaijan'
    ,'AZE'
    ,'AZ'
    ,'994'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'31')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('18'
    ,'1'
    ,'Bahamas'
    ,'BHS'
    ,'BS'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'44')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('19'
    ,'1'
    ,'Bahrain'
    ,'BHR'
    ,'BH'
    ,'973'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'48')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('20'
    ,'1'
    ,'Bangladesh'
    ,'BGD'
    ,'BD'
    ,'880'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'50')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('21'
    ,'1'
    ,'Barbados'
    ,'BRB'
    ,'BB'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'52')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('22'
    ,'1'
    ,'Belarus'
    ,'BLR'
    ,'BY'
    ,'375'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'112')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('23'
    ,'1'
    ,'Belgium'
    ,'BEL'
    ,'BE'
    ,'32'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'56')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('24'
    ,'1'
    ,'Belize'
    ,'BLZ'
    ,'BZ'
    ,'501'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'84')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('25'
    ,'1'
    ,'Benin'
    ,'BEN'
    ,'BJ'
    ,'229'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'204')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('26'
    ,'1'
    ,'Bermuda'
    ,'BMU'
    ,'BM'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'60')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('27'
    ,'1'
    ,'Bhutan'
    ,'BTN'
    ,'BT'
    ,'975'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'64')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('28'
    ,'1'
    ,'Bolivia'
    ,'BOL'
    ,'BO'
    ,'591'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'68')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('29'
    ,'1'
    ,'Bosnia and Herzegovina'
    ,'BIH'
    ,'BA'
    ,'387'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'70')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('30'
    ,'1'
    ,'Botswana'
    ,'BWA'
    ,'BW'
    ,'267'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'72')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('31'
    ,'1'
    ,'Bouvet Island'
    ,' '
    ,'BV'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('32'
    ,'1'
    ,'Brazil'
    ,'BRA'
    ,'BR'
    ,'55'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'76')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('33'
    ,'1'
    ,'British Indian Ocean Territory'
    ,' '
    ,'IO'
    ,'246'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('34'
    ,'1'
    ,'Brunei Darussalam'
    ,'BRN'
    ,'BN'
    ,'673'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'96')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('35'
    ,'1'
    ,'Bulgaria'
    ,'BGR'
    ,'BG'
    ,'359'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'100')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('36'
    ,'1'
    ,'Burkina Faso'
    ,'BFA'
    ,'BF'
    ,'226'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'854')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('37'
    ,'1'
    ,'Burundi'
    ,'BDI'
    ,'BI'
    ,'257'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'108')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('38'
    ,'1'
    ,'Cambodia'
    ,'KHM'
    ,'KH'
    ,'855'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'116')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('39'
    ,'1'
    ,'Cameroon'
    ,'CMR'
    ,'CM'
    ,'237'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'120')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('40'
    ,'1'
    ,'Canada'
    ,'CAN'
    ,'CA'
    ,'1'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'124')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('41'
    ,'1'
    ,'Cape Verde'
    ,'CPV'
    ,'CV'
    ,'238'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'132')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('42'
    ,'1'
    ,'Cayman Islands'
    ,'CYM'
    ,'KY'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'136')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('43'
    ,'1'
    ,'Central African Republic'
    ,'CAF'
    ,'CF'
    ,'236'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'140')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('44'
    ,'1'
    ,'Chad'
    ,'TCD'
    ,'TD'
    ,'235'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'148')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('45'
    ,'1'
    ,'Chile'
    ,'CHL'
    ,'CL'
    ,'56'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'152')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('46'
    ,'1'
    ,'China'
    ,'CHN'
    ,'CN'
    ,'86'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'156')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('47'
    ,'1'
    ,'Christmas Island'
    ,' '
    ,'CX'
    ,'61'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('48'
    ,'1'
    ,'Cocos (Keeling) Islands'
    ,' '
    ,'CC'
    ,'672'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('49'
    ,'1'
    ,'Colombia'
    ,'COL'
    ,'CO'
    ,'57'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'170')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('50'
    ,'1'
    ,'Comoros'
    ,'COM'
    ,'KM'
    ,'269'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'174')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('51'
    ,'1'
    ,'Congo'
    ,'COG'
    ,'CG'
    ,'242'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'178')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('52'
    ,'1'
    ,'Congo the Democratic Republic of the'
    ,'COD'
    ,'CD'
    ,'242'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'180')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('53'
    ,'1'
    ,'Cook Islands'
    ,'COK'
    ,'CK'
    ,'682'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'184')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('54'
    ,'1'
    ,'Costa Rica'
    ,'CRI'
    ,'CR'
    ,'506'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'188')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('55'
    ,'1'
    ,'Cote D''Ivoire'
    ,'CIV'
    ,'CI'
    ,'225'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'384')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('56'
    ,'1'
    ,'Croatia'
    ,'HRV'
    ,'HR'
    ,'385'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'191')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('57'
    ,'1'
    ,'Cuba'
    ,'CUB'
    ,'CU'
    ,'53'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'192')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('58'
    ,'1'
    ,'Cyprus'
    ,'CYP'
    ,'CY'
    ,'357'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'196')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('59'
    ,'1'
    ,'Czech Republic'
    ,'CZE'
    ,'CZ'
    ,'420'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'203')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('60'
    ,'1'
    ,'Denmark'
    ,'DNK'
    ,'DK'
    ,'45'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'208')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('61'
    ,'1'
    ,'Djibouti'
    ,'DJI'
    ,'DJ'
    ,'253'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'262')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('62'
    ,'1'
    ,'Dominica'
    ,'DMA'
    ,'DM'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'212')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('63'
    ,'1'
    ,'Dominican Republic'
    ,'DOM'
    ,'DO'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'214')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('64'
    ,'1'
    ,'Ecuador'
    ,'ECU'
    ,'EC'
    ,'593'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'218')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('65'
    ,'1'
    ,'Egypt'
    ,'EGY'
    ,'EG'
    ,'20'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'818')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('66'
    ,'1'
    ,'El Salvador'
    ,'SLV'
    ,'SV'
    ,'503'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'222')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('67'
    ,'1'
    ,'Equatorial Guinea'
    ,'GNQ'
    ,'GQ'
    ,'240'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'226')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('68'
    ,'1'
    ,'Eritrea'
    ,'ERI'
    ,'ER'
    ,'291'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'232')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('69'
    ,'1'
    ,'Estonia'
    ,'EST'
    ,'EE'
    ,'372'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'233')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('70'
    ,'1'
    ,'Ethiopia'
    ,'ETH'
    ,'ET'
    ,'251'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'231')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('71'
    ,'1'
    ,'Falkland Islands (Malvinas)'
    ,'FLK'
    ,'FK'
    ,'500'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'238')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('72'
    ,'1'
    ,'Faroe Islands'
    ,'FRO'
    ,'FO'
    ,'298'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'234')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('73'
    ,'1'
    ,'Fiji'
    ,'FJI'
    ,'FJ'
    ,'679'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'242')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('74'
    ,'1'
    ,'Finland'
    ,'FIN'
    ,'FI'
    ,'358'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'246')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('75'
    ,'1'
    ,'France'
    ,'FRA'
    ,'FR'
    ,'33'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'250')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('76'
    ,'1'
    ,'French Guiana'
    ,'GUF'
    ,'GF'
    ,'594'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'254')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('77'
    ,'1'
    ,'French Polynesia'
    ,'PYF'
    ,'PF'
    ,'689'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'258')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('78'
    ,'1'
    ,'French Southern Territories'
    ,' '
    ,'TF'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('79'
    ,'1'
    ,'Gabon'
    ,'GAB'
    ,'GA'
    ,'241'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'266')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('80'
    ,'1'
    ,'Gambia'
    ,'GMB'
    ,'GM'
    ,'220'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'270')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('81'
    ,'1'
    ,'Georgia'
    ,'GEO'
    ,'GE'
    ,'995'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'268')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('82'
    ,'1'
    ,'Germany'
    ,'DEU'
    ,'DE'
    ,'49'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'276')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('83'
    ,'1'
    ,'Ghana'
    ,'GHA'
    ,'GH'
    ,'233'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'288')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('84'
    ,'1'
    ,'Gibraltar'
    ,'GIB'
    ,'GI'
    ,'350'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'292')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('85'
    ,'1'
    ,'Greece'
    ,'GRC'
    ,'GR'
    ,'30'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'300')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('86'
    ,'1'
    ,'Greenland'
    ,'GRL'
    ,'GL'
    ,'299'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'304')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('87'
    ,'1'
    ,'Grenada'
    ,'GRD'
    ,'GD'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'308')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('88'
    ,'1'
    ,'Guadeloupe'
    ,'GLP'
    ,'GP'
    ,'590'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'312')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('89'
    ,'1'
    ,'Guam'
    ,'GUM'
    ,'GU'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'316')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('90'
    ,'1'
    ,'Guatemala'
    ,'GTM'
    ,'GT'
    ,'502'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'320')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('91'
    ,'1'
    ,'Guinea'
    ,'GIN'
    ,'GN'
    ,'224'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'324')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('92'
    ,'1'
    ,'Guinea-Bissau'
    ,'GNB'
    ,'GW'
    ,'245'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'624')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('93'
    ,'1'
    ,'Guyana'
    ,'GUY'
    ,'GY'
    ,'592'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'328')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('94'
    ,'1'
    ,'Haiti'
    ,'HTI'
    ,'HT'
    ,'509'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'332')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('95'
    ,'1'
    ,'Heard Island and Mcdonald Islands'
    ,' '
    ,'HM'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('96'
    ,'1'
    ,'Holy See (Vatican City State)'
    ,'VAT'
    ,'VA'
    ,'39'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'336')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('97'
    ,'1'
    ,'Honduras'
    ,'HND'
    ,'HN'
    ,'504'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'340')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('98'
    ,'1'
    ,'Hong Kong'
    ,'HKG'
    ,'HK'
    ,'852'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'344')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('99'
    ,'1'
    ,'Hungary'
    ,'HUN'
    ,'HU'
    ,'36'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'348')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('100'
    ,'1'
    ,'Iceland'
    ,'ISL'
    ,'IS'
    ,'354'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'352')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('101'
    ,'1'
    ,'India'
    ,'IND'
    ,'IN'
    ,'91'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'356')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('102'
    ,'1'
    ,'Indonesia'
    ,'IDN'
    ,'ID'
    ,'62'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'360')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('103'
    ,'1'
    ,'Iran Islamic Republic of'
    ,'IRN'
    ,'IR'
    ,'98'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'364')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('104'
    ,'1'
    ,'Iraq'
    ,'IRQ'
    ,'IQ'
    ,'964'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'368')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('105'
    ,'1'
    ,'Ireland'
    ,'IRL'
    ,'IE'
    ,'353'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'372')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('106'
    ,'1'
    ,'Israel'
    ,'ISR'
    ,'IL'
    ,'972'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'376')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('107'
    ,'1'
    ,'Italy'
    ,'ITA'
    ,'IT'
    ,'39'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'380')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('108'
    ,'1'
    ,'Jamaica'
    ,'JAM'
    ,'JM'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'388')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('109'
    ,'1'
    ,'Japan'
    ,'JPN'
    ,'JP'
    ,'81'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'392')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('110'
    ,'1'
    ,'Jordan'
    ,'JOR'
    ,'JO'
    ,'962'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'400')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('111'
    ,'1'
    ,'Kazakhstan'
    ,'KAZ'
    ,'KZ'
    ,'7'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'398')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('112'
    ,'1'
    ,'Kenya'
    ,'KEN'
    ,'KE'
    ,'254'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'404')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('113'
    ,'1'
    ,'Kiribati'
    ,'KIR'
    ,'KI'
    ,'686'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'296')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('114'
    ,'1'
    ,'Korea Democratic People''s Republic of'
    ,'PRK'
    ,'KP'
    ,'850'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'408')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('115'
    ,'1'
    ,'Korea Republic of'
    ,'KOR'
    ,'KR'
    ,'82'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'410')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('116'
    ,'1'
    ,'Kuwait'
    ,'KWT'
    ,'KW'
    ,'965'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'414')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('117'
    ,'1'
    ,'Kyrgyzstan'
    ,'KGZ'
    ,'KG'
    ,'996'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'417')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('118'
    ,'1'
    ,'Lao People''s Democratic Republic'
    ,'LAO'
    ,'LA'
    ,'856'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'418')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('119'
    ,'1'
    ,'Latvia'
    ,'LVA'
    ,'LV'
    ,'371'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'428')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('120'
    ,'1'
    ,'Lebanon'
    ,'LBN'
    ,'LB'
    ,'961'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'422')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('121'
    ,'1'
    ,'Lesotho'
    ,'LSO'
    ,'LS'
    ,'266'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'426')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('122'
    ,'1'
    ,'Liberia'
    ,'LBR'
    ,'LR'
    ,'231'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'430')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('123'
    ,'1'
    ,'Libyan Arab Jamahiriya'
    ,'LBY'
    ,'LY'
    ,'218'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'434')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('124'
    ,'1'
    ,'Liechtenstein'
    ,'LIE'
    ,'LI'
    ,'423'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'438')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('125'
    ,'1'
    ,'Lithuania'
    ,'LTU'
    ,'LT'
    ,'370'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'440')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('126'
    ,'1'
    ,'Luxembourg'
    ,'LUX'
    ,'LU'
    ,'352'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'442')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('127'
    ,'1'
    ,'Macao'
    ,'MAC'
    ,'MO'
    ,'853'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'446')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('128'
    ,'1'
    ,'Macedonia, the Former Yugoslav Republic of'
    ,'MKD'
    ,'MK'
    ,'389'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'807')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('129'
    ,'1'
    ,'Madagascar'
    ,'MDG'
    ,'MG'
    ,'261'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'450')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('130'
    ,'1'
    ,'Malawi'
    ,'MWI'
    ,'MW'
    ,'265'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'454')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('131'
    ,'1'
    ,'Malaysia'
    ,'MYS'
    ,'MY'
    ,'60'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'458')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('132'
    ,'1'
    ,'Maldives'
    ,'MDV'
    ,'MV'
    ,'960'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'462')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('133'
    ,'1'
    ,'Mali'
    ,'MLI'
    ,'ML'
    ,'223'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'466')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('134'
    ,'1'
    ,'Malta'
    ,'MLT'
    ,'MT'
    ,'356'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'470')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('135'
    ,'1'
    ,'Marshall Islands'
    ,'MHL'
    ,'MH'
    ,'692'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'584')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('136'
    ,'1'
    ,'Martinique'
    ,'MTQ'
    ,'MQ'
    ,'596'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'474')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('137'
    ,'1'
    ,'Mauritania'
    ,'MRT'
    ,'MR'
    ,'222'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'478')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('138'
    ,'1'
    ,'Mauritius'
    ,'MUS'
    ,'MU'
    ,'230'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'480')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('139'
    ,'1'
    ,'Mayotte'
    ,' '
    ,'YT'
    ,'269'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('140'
    ,'1'
    ,'Mexico'
    ,'MEX'
    ,'MX'
    ,'52'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'484')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('141'
    ,'1'
    ,'Micronesia Federated States of'
    ,'FSM'
    ,'FM'
    ,'691'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'583')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('142'
    ,'1'
    ,'Moldova Republic of'
    ,'MDA'
    ,'MD'
    ,'373'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'498')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('143'
    ,'1'
    ,'Monaco'
    ,'MCO'
    ,'MC'
    ,'377'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'492')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('144'
    ,'1'
    ,'Mongolia'
    ,'MNG'
    ,'MN'
    ,'976'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'496')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('145'
    ,'1'
    ,'Montserrat'
    ,'MSR'
    ,'MS'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'500')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('146'
    ,'1'
    ,'Morocco'
    ,'MAR'
    ,'MA'
    ,'212'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'504')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('147'
    ,'1'
    ,'Mozambique'
    ,'MOZ'
    ,'MZ'
    ,'258'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'508')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('148'
    ,'1'
    ,'Myanmar'
    ,'MMR'
    ,'MM'
    ,'95'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'104')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('149'
    ,'1'
    ,'Namibia'
    ,'NAM'
    ,'NA'
    ,'264'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'516')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('150'
    ,'1'
    ,'Nauru'
    ,'NRU'
    ,'NR'
    ,'674'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'520')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('151'
    ,'1'
    ,'Nepal'
    ,'NPL'
    ,'NP'
    ,'977'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'524')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('152'
    ,'1'
    ,'Netherlands'
    ,'NLD'
    ,'NL'
    ,'31'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'528')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('153'
    ,'1'
    ,'Netherlands Antilles'
    ,'ANT'
    ,'AN'
    ,'599'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'530')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('154'
    ,'1'
    ,'New Caledonia'
    ,'NCL'
    ,'NC'
    ,'687'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'540')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('155'
    ,'1'
    ,'New Zealand'
    ,'NZL'
    ,'NZ'
    ,'64'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'554')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('156'
    ,'1'
    ,'Nicaragua'
    ,'NIC'
    ,'NI'
    ,'505'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'558')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('157'
    ,'1'
    ,'Niger'
    ,'NER'
    ,'NE'
    ,'227'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'562')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('158'
    ,'1'
    ,'Nigeria'
    ,'NGA'
    ,'NG'
    ,'234'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'566')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('159'
    ,'1'
    ,'Niue'
    ,'NIU'
    ,'NU'
    ,'683'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'570')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('160'
    ,'1'
    ,'Norfolk Island'
    ,'NFK'
    ,'NF'
    ,'672'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'574')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('161'
    ,'1'
    ,'Northern Mariana Islands'
    ,'MNP'
    ,'MP'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'580')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('162'
    ,'1'
    ,'Norway'
    ,'NOR'
    ,'NO'
    ,'47'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'578')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('163'
    ,'1'
    ,'Oman'
    ,'OMN'
    ,'OM'
    ,'968'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'512')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('164'
    ,'1'
    ,'Pakistan'
    ,'PAK'
    ,'PK'
    ,'92'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'586')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('165'
    ,'1'
    ,'Palau'
    ,'PLW'
    ,'PW'
    ,'680'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'585')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('166'
    ,'1'
    ,'Palestinian'
    ,' '
    ,'PS'
    ,'970'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('167'
    ,'1'
    ,'Panama'
    ,'PAN'
    ,'PA'
    ,'507'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'591')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('168'
    ,'1'
    ,'Papua New Guinea'
    ,'PNG'
    ,'PG'
    ,'675'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'598')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('169'
    ,'1'
    ,'Paraguay'
    ,'PRY'
    ,'PY'
    ,'595'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'600')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('170'
    ,'1'
    ,'Peru'
    ,'PER'
    ,'PE'
    ,'51'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'604')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('171'
    ,'1'
    ,'Philippines'
    ,'PHL'
    ,'PH'
    ,'63'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'608')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('172'
    ,'1'
    ,'Pitcairn'
    ,'PCN'
    ,'PN'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'612')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('173'
    ,'1'
    ,'Poland'
    ,'POL'
    ,'PL'
    ,'48'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'616')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('174'
    ,'1'
    ,'Portugal'
    ,'PRT'
    ,'PT'
    ,'351'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'620')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('175'
    ,'1'
    ,'Puerto Rico'
    ,'PRI'
    ,'PR'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'630')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('176'
    ,'1'
    ,'Qatar'
    ,'QAT'
    ,'QA'
    ,'974'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'634')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('177'
    ,'1'
    ,'Reunion'
    ,'REU'
    ,'RE'
    ,'262'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'638')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('178'
    ,'1'
    ,'Romania'
    ,'ROM'
    ,'RO'
    ,'40'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'642')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('179'
    ,'1'
    ,'Russian Federation'
    ,'RUS'
    ,'RU'
    ,'70'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'643')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('180'
    ,'1'
    ,'Rwanda'
    ,'RWA'
    ,'RW'
    ,'250'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'646')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('181'
    ,'1'
    ,'Saint Helena'
    ,'SHN'
    ,'SH'
    ,'290'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'654')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('182'
    ,'1'
    ,'Saint Kitts and Nevis'
    ,'KNA'
    ,'KN'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'659')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('183'
    ,'1'
    ,'Saint Lucia'
    ,'LCA'
    ,'LC'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'662')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('184'
    ,'1'
    ,'Saint Pierre and Miquelon'
    ,'SPM'
    ,'PM'
    ,'508'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'666')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('185'
    ,'1'
    ,'Saint Vincent and the Grenadines'
    ,'VCT'
    ,'VC'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'670')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('186'
    ,'1'
    ,'Samoa'
    ,'WSM'
    ,'WS'
    ,'684'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'882')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('187'
    ,'1'
    ,'San Marino'
    ,'SMR'
    ,'SM'
    ,'378'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'674')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('188'
    ,'1'
    ,'Sao Tome and Principe'
    ,'STP'
    ,'ST'
    ,'239'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'678')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('189'
    ,'1'
    ,'Saudi Arabia'
    ,'SAU'
    ,'SA'
    ,'966'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'682')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('190'
    ,'1'
    ,'Senegal'
    ,'SEN'
    ,'SN'
    ,'221'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'686')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('191'
    ,'1'
    ,'Serbia and Montenegro'
    ,' '
    ,'CS'
    ,'381'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('192'
    ,'1'
    ,'Seychelles'
    ,'SYC'
    ,'SC'
    ,'248'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'690')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('193'
    ,'1'
    ,'Sierra Leone'
    ,'SLE'
    ,'SL'
    ,'232'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'694')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('194'
    ,'1'
    ,'Singapore'
    ,'SGP'
    ,'SG'
    ,'65'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'702')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('195'
    ,'1'
    ,'Slovakia'
    ,'SVK'
    ,'SK'
    ,'421'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'703')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('196'
    ,'1'
    ,'Slovenia'
    ,'SVN'
    ,'SI'
    ,'386'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'705')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('197'
    ,'1'
    ,'Solomon Islands'
    ,'SLB'
    ,'SB'
    ,'677'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'90')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('198'
    ,'1'
    ,'Somalia'
    ,'SOM'
    ,'SO'
    ,'252'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'706')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('199'
    ,'1'
    ,'South Africa'
    ,'ZAF'
    ,'ZA'
    ,'27'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'710')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('200'
    ,'1'
    ,'South Georgia and the South Sandwich Islands'
    ,' '
    ,'GS'
    ,'0'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('201'
    ,'1'
    ,'Sri Lanka'
    ,'LKA'
    ,'LK'
    ,'94'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'144')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('202'
    ,'1'
    ,'Sudan'
    ,'SDN'
    ,'SD'
    ,'249'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'736')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('203'
    ,'1'
    ,'Suriname'
    ,'SUR'
    ,'SR'
    ,'597'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'740')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('204'
    ,'1'
    ,'Svalbard and Jan Mayen'
    ,'SJM'
    ,'SJ'
    ,'47'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'744')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('205'
    ,'1'
    ,'Swaziland'
    ,'SWZ'
    ,'SZ'
    ,'268'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'748')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('206'
    ,'1'
    ,'Sweden'
    ,'SWE'
    ,'SE'
    ,'46'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'752')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('207'
    ,'1'
    ,'Switzerland'
    ,'CHE'
    ,'CH'
    ,'41'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'756')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('208'
    ,'1'
    ,'Syrian Arab Republic'
    ,'SYR'
    ,'SY'
    ,'963'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'760')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('209'
    ,'1'
    ,'Taiwan, Province of China'
    ,'TWN'
    ,'TW'
    ,'886'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'158')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('210'
    ,'1'
    ,'Tajikistan'
    ,'TJK'
    ,'TJ'
    ,'992'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'762')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('211'
    ,'1'
    ,'Tanzania, United Republic of'
    ,'TZA'
    ,'TZ'
    ,'255'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'834')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('212'
    ,'1'
    ,'Thailand'
    ,'THA'
    ,'TH'
    ,'66'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'764')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('213'
    ,'1'
    ,'Timor-Leste'
    ,' '
    ,'TL'
    ,'670'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('214'
    ,'1'
    ,'Togo'
    ,'TGO'
    ,'TG'
    ,'228'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'768')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('215'
    ,'1'
    ,'Tokelau'
    ,'TKL'
    ,'TK'
    ,'690'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'772')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('216'
    ,'1'
    ,'Tonga'
    ,'TON'
    ,'TO'
    ,'676'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'776')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('217'
    ,'1'
    ,'Trinidad and Tobago'
    ,'TTO'
    ,'TT'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'780')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('218'
    ,'1'
    ,'Tunisia'
    ,'TUN'
    ,'TN'
    ,'216'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'788')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('219'
    ,'1'
    ,'Turkey'
    ,'TUR'
    ,'TR'
    ,'90'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'792')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('220'
    ,'1'
    ,'Turkmenistan'
    ,'TKM'
    ,'TM'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'795')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('221'
    ,'1'
    ,'Turks and Caicos Islands'
    ,'TCA'
    ,'TC'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'796')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('222'
    ,'1'
    ,'Tuvalu'
    ,'TUV'
    ,'TV'
    ,'688'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'798')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('223'
    ,'1'
    ,'Uganda'
    ,'UGA'
    ,'UG'
    ,'256'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'800')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('224'
    ,'1'
    ,'Ukraine'
    ,'UKR'
    ,'UA'
    ,'380'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'804')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('225'
    ,'1'
    ,'United Arab Emirates'
    ,'ARE'
    ,'AE'
    ,'971'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'784')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('226'
    ,'1'
    ,'United Kingdom'
    ,'GBR'
    ,'GB'
    ,'44'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'826')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('227'
    ,'1'
    ,'United States Minor Outlying Islands'
    ,' '
    ,'UM'
    ,'1'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,NULL)

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('228'
    ,'1'
    ,'Uruguay'
    ,'URY'
    ,'UY'
    ,'598'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'858')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('229'
    ,'1'
    ,'Uzbekistan'
    ,'UZB'
    ,'UZ'
    ,'998'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'860')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('230'
    ,'1'
    ,'Vanuatu'
    ,'VUT'
    ,'VU'
    ,'678'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'548')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('231'
    ,'1'
    ,'Venezuela'
    ,'VEN'
    ,'VE'
    ,'58'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'862')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('232'
    ,'1'
    ,'Viet Nam'
    ,'VNM'
    ,'VN'
    ,'84'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'704')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('233'
    ,'1'
    ,'Virgin Islands British'
    ,'VGB'
    ,'VG'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'92')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('234'
    ,'1'
    ,'Virgin Islands U.S.'
    ,'VIR'
    ,'VI'
    ,'*'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'850')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('235'
    ,'1'
    ,'Wallis and Futuna'
    ,'WLF'
    ,'WF'
    ,'681'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'876')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('236'
    ,'1'
    ,'Western Sahara'
    ,'ESH'
    ,'EH'
    ,'212'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'732')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('237'
    ,'1'
    ,'Yemen'
    ,'YEM'
    ,'YE'
    ,'967'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'887')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('238'
    ,'1'
    ,'Zambia'
    ,'ZMB'
    ,'ZM'
    ,'260'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'894')

INSERT INTO [country]
    ([CountryID]
    ,[LanguageID]
    ,[CountryName]
    ,[CountryCode]
    ,[CountryCodeAlpha2]
    ,[CountryCallingCode]
    ,[CreatedDate]
    ,[UpdatedDate]
    ,[ModifiedBy]
    ,[Active]
    ,[numcode])
VALUES
    ('239'
    ,'1'
    ,'Zimbabwe'
    ,'ZWE'
    ,'ZW'
    ,'263'
    ,'1/21/2016 12:00:00 AM'
    ,'1/21/2016 12:00:00 AM'
    ,'jd'
    ,'True'
    ,'716')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
