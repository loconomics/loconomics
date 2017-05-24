/****** Object:  UserDefinedFunction [dbo].[fx_IfNW]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Returns the @value if is not 
-- null, not empty and not a white spaces string
-- In that cases, the @default value is returned
-- Default can be null, empty, whitespaces
-- really or whatever you want.
-- =============================================
CREATE FUNCTION [dbo].[fx_IfNW]
(
	@value nvarchar(4000),
	@default nvarchar(4000)
)
RETURNS nvarchar(4000)
AS
BEGIN

	DECLARE @ret nvarchar(4000)

	IF @value is null OR @value like ''
		OR RTRIM(LTRIM(@value)) like ''
		SET @ret = @default
	ELSE
		SET @ret = @value

	RETURN @ret

END
GO
