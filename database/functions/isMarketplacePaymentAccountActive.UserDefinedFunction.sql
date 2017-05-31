/****** Object:  UserDefinedFunction [dbo].[isMarketplacePaymentAccountActive]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2015-09-15
-- Description:	Checks if the payment account
-- to collect payments on the marketplace
-- bookings for a given userID is active.
-- =============================================
CREATE FUNCTION [dbo].[isMarketplacePaymentAccountActive]
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
GO
