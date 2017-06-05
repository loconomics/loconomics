ALTER FUNCTION [dbo].[fxCheckAlertAffectsUser] (
	@UserID int,
	@AlertID int
) RETURNS Bit
AS BEGIN
	DECLARE @IsProvider bit, @IsCustomer bit
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
