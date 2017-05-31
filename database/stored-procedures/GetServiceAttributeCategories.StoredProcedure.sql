/****** Object:  StoredProcedure [dbo].[GetServiceAttributeCategories]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetServiceAttributeCategories]
	-- Add the parameters for the stored procedure here

	@PositionID int,
	@LanguageID int = 1,
	@CountryID int = 1,
	@OnlyBookingPathSelection bit = 0

-- exec GetServiceAttributeCategories 14,1,1

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	   SELECT DISTINCT
	   a.DisplayRank,
	   a.ServiceAttributeCategoryID,
	   a.ServiceAttributeCategory as ServiceCat,
	   a.ServiceAttributeCategoryDescription,
	   a.RequiredInput,
	   a.SideBarCategory
	   FROM serviceattributecategory a
	   join servicecategorypositionattribute c
	   on a.ServiceAttributeCategoryID = c.ServiceAttributeCategoryID
	   and a.LanguageID = c.LanguageID
	   and a.CountryID = c.CountryID
	   WHERE  c.PositionID = @PositionID
	   and c.LanguageID  = @LanguageID
	   and c.CountryID = @CountryID
	   and (a.PricingOptionCategory is null OR a.PricingOptionCategory = 1)
	   -- only actived
	   and a.Active = 1
	   and c.Active = 1
	   -- booking path selection
	   and (@OnlyBookingPathSelection = 0 OR BookingPathSelection = 1)
	   ORDER BY a.DisplayRank ASC, a.ServiceAttributeCategory ASC
	   
	


END
GO
