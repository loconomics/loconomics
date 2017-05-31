/****** Object:  StoredProcedure [dbo].[GetPosition]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetPosition]
	-- Add the parameters for the stored procedure here
	
	@PositionID int,
	@LanguageID int = 1,
	@CountryID int = 1

-- exec getuserprofile 2,14

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
			SELECT 
				PositionSingular,
				PositionDescription
			FROM dbo.positions b
			WHERE b.PositionID = @PositionID
			and b.LanguageID = @LanguageID
			and b.CountryID = @CountryID

END
GO
