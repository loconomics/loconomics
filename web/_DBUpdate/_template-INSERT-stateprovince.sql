INSERT INTO [stateprovince]
           ([StateProvinceID]
           ,[StateProvinceName]
           ,[StateProvinceCode]
           ,[CountryID]
           ,[RegionCode]
           ,[PostalCodePrefix])
     VALUES
           (@StateProvinceID
           ,@StateProvinceName
           ,@StateProvinceCode
           ,@CountryID
           ,@RegionCode
           ,@PostalCodePrefix)
