-- fx_concat.sql


/* Iago Lorenzo Salgueiro:
 * Concat two strings with a nexus
 * between if they are not null.
 * If some string is null or empty, only the
 * another will be retrived, without nexus
 */
ALTER FUNCTION [dbo].[fx_concat] (
 @str1 varchar(8000),
 @str2 varchar(8000),
 @nexo varchar(8000) = ''
)
RETURNS varchar(8000)
AS
BEGIN
 DECLARE @ret varchar(8000)
 if @str1 is null OR @str1 like ''
  SET @ret = @str2
 else if @str2 is null OR @str2 like ''
  SET @ret = @str1
 else
  SET @ret = @str1 + @nexo + @str2

 if @ret is null
  SET @ret = ''

 return @ret

END

GO
-- fx_concatBothOrNothing.sql

/* Iago Lorenzo Salgueiro:
 * Concat two strings with a nexus
 * between if they are not null.
 * If some string is null or empty,
 * empty string is returned
 */
ALTER FUNCTION [dbo].[fx_concatBothOrNothing] (
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
-- fx_IfNW.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Returns the @value if is not 
-- null, not empty and not a white spaces string
-- In that cases, the @default value is returned
-- Default can be null, empty, whitespaces
-- really or whatever you want.
-- =============================================
ALTER FUNCTION [dbo].[fx_IfNW]
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
-- fxCheckAlertAffectsUser.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 06/29/2012
-- Description:	Returns 1 (as bit, means true)
-- if that alert must be checked for
-- that user, because the user type (IsCustomer,
-- IsProvider) and the AlertTypeID (only
-- providers alert, only customers, both)
-- =============================================
ALTER FUNCTION [dbo].[fxCheckAlertAffectsUser] (
	@UserID int,
	@AlertID int
) RETURNS Bit
AS BEGIN
	DECLARE @IsProvider bit, @IsCustomer bit
	DECLARE @AlertTypeID int
	SELECT @IsProvider = IsProvider FROM Users WHERE UserID = @UserID
	SELECT @IsCustomer = IsCustomer FROM Users WHERE UserID = @UserID
	
	DECLARE @Checked bit
	SET @Checked = Cast (0 As bit)
	
	IF @IsProvider = 1 AND @AlertID IN (SELECT AlertID FROM Alert WHERE ProviderAlert = 1)
		SET @Checked = Cast (1 As bit)
	IF @IsCustomer = 1 AND @AlertID IN (SELECT AlertID FROM Alert WHERE CustomerAlert = 1)
		SET @Checked = Cast (1 As bit)
		
	RETURN @Checked
END
GO
-- isMarketplacePaymentAccountActive.sql


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2015-09-15
-- Description:	Checks if the payment account
-- to collect payments on the marketplace
-- bookings for a given userID is active.
-- =============================================
ALTER FUNCTION isMarketplacePaymentAccountActive
(
	@userID int
)
RETURNS bit
AS
BEGIN
	-- Declare the return variable here
	DECLARE @ret bit

	SET @ret = CASE WHEN EXISTS (
		SELECT	ProviderUserID
		FROM	ProviderPaymentAccount
		WHERE	ProviderUserID = @UserID
				 AND
				-- Braintree given status must be 'active' or 'pending'
                -- Allow for 'pending' is a small risk we take on 2013/12/11 https://github.com/dani0198/Loconomics/issues/408#issuecomment-30338668
				[Status] IN ('active', 'pending')
	) THEN CAST(1 as bit) ELSE CAST(0 as bit) END

	-- Return the result of the function
	RETURN @ret

END
