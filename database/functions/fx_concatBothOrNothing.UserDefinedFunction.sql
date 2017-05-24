/****** Object:  UserDefinedFunction [dbo].[fx_concatBothOrNothing]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/* Iago Lorenzo Salgueiro:
 * Concat two strings with a nexus
 * between if they are not null.
 * If some string is null or empty,
 * empty string is returned
 */
CREATE function [dbo].[fx_concatBothOrNothing] (
 @str1 varchar(8000),
 @str2 varchar(8000),
 @nexo varchar(8000) = ''
)
RETURNS varchar(8000)
AS
BEGIN
 DECLARE @ret varchar(8000)
 if @str1 is null OR @str1 like '' OR @str2 is null OR @str2 like ''
  SET @ret = ''
 else
  SET @ret = @str1 + @nexo + @str2

 return @ret

END
GO
