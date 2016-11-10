-- Disable incomplete pricing types: hourly and housekeeper pricings
update [positionpricingtype] set active = 0 where pricingTypeID IN (1, 9, 10, 11)
  
-- Add consultation pricing for housekeepr so it has some pricing almost (and not only add-on)
insert into [positionpricingtype] (PositionID, PricingTypeID, ClientTypeID, LanguageID, CountryID, CreatedDate, UpdatedDate, ModifiedBy, Active)
values (14, 5, 1, 1, 1, '2016-06-28 15:43', '2016-06-28 15:43', 'sys', 1)