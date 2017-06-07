/****** Object:  StoredProcedure [dbo].[CheckUserEmail]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CheckUserEmail]
	-- Add the parameters for the stored procedure here
	@Email nvarchar(56)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    SELECT Email FROM UserProfile WHERE LOWER(Email) = LOWER(@Email)
    
    
    
    
    
END
GO
