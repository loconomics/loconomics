/****** Object:  StoredProcedure [dbo].[GetServiceAttributes]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetServiceAttributes]
	-- Add the parameters for the stored procedure here

	@PositionID int,
	-- CategoryID can be Zero (0) to retrieve all attributes without regarding the category
	@ServiceAttributeCategoryID int,
	@LanguageID int = 1,
	@CountryID int = 1,
	@UserID int = 0,
	@OnlyUserChecked bit = 0

-- exec GetServiceAttributes 14,2,1,1

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
		  SELECT 
		  se.ServiceAttributeCategoryID, 
		  se.ServiceAttributeCategory as ServiceCat,
		  s.ServiceAttributeDescription,
		  s.ServiceAttributeID, 
		  s.Name as ServiceAttribute,
		  
		  -- iagosrl: added UserChecked to know if is an attribute
		  -- assigned to the @UserID
		  (case when @UserID <= 0 OR us.UserID is null then cast(0 as bit)
				else cast(1 as bit)
		  end) as UserChecked
		  ,coalesce(se.EligibleForPackages, cast(0 as bit)) As EligibleForPackages
		  
		  from servicecategorypositionattribute d
		  join serviceattribute s 
		  on d.ServiceAttributeID = s.ServiceAttributeID 
		  join serviceattributecategory se 
		  on d.ServiceAttributeCategoryID = se.ServiceAttributeCategoryID 
		  and d.LanguageID = se.LanguageID
		  and d.CountryID = se.CountryID
		  and se.LanguageID = s.LanguageID
		  and se.CountryID = s.CountryID
		  
		  -- iagosrl: I added param @UserID to optionally (left join) get
		  --  attributes selected by the user, not filtering else adding a
		  --  new result field 'UserChecked' as true/false
		  left join userprofileserviceattributes as us
		  on d.ServiceAttributeID = us.ServiceAttributeID
		  and d.ServiceAttributeCategoryID = us.ServiceAttributeCategoryID
		  and d.PositionID = us.PositionID
		  and d.LanguageID = us.LanguageID
		  and d.CountryID = us.CountryID
		  and us.Active = 1
		  and us.UserID = @UserID
		  
		  WHERE  d.PositionID = @PositionID  
		  -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
		  and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
		  and d.LanguageID  = @LanguageID
		  and d.CountryID = @CountryID
		  -- only actived
		  and d.Active = 1
		  and se.Active = 1
		  and s.Active = 1
		  and (@OnlyUserChecked = 0 OR us.UserID > 0)
		  ORDER BY s.DisplayRank ASC, s.Name ASC

END
GO
