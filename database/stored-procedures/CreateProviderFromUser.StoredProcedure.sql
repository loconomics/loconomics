/****** Object:  StoredProcedure [dbo].[CreateProviderFromUser]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-03
-- Description:	Converts an existing user 
-- (a customer) into a provider, allowing
-- update some user data and setting needed
-- provider fields as in CreateProvider proc.
-- =============================================
CREATE PROCEDURE [dbo].[CreateProviderFromUser] (
	@UserID int,
	@Firstname varchar(45),
    @Lastname varchar(145),
    @PostalCodeID int,
    @StateProvinceID int,
    @LangID int,
    @CountryID int,
    @emailcontact bit,
    @BookCode varchar(64)
) AS BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	UPDATE Users SET
		FirstName = coalesce(@FirstName, FirstName),
		LastName = coalesce(@LastName, LastName),
		PreferredLanguageID = coalesce(@LangID, PreferredLanguageID),
		PreferredCountryID = coalesce(@CountryID, PreferredCountryID),
		BookCode = @BookCode,
		IsProvider = 1,
		-- This proc is used most of time by providers registered from facebook, or users
		-- that start using the normal register form and then continues with the provider-sign-up,
		-- but only wants be providers: here we update the IsCustomer field based on if user
		-- have activity as customer of not (if it have bookingrequests, is customer, else
		-- only provider)
		IsCustomer = (CASE WHEN (
			SELECT	count(*)
			FROM	BookingRequest
			WHERE	BookingRequest.CustomerUserID = @UserID
		) = 0 THEN Cast(0 As bit) ELSE Cast(1 As bit) END),
		UpdatedDate = getdate(),
		ModifiedBy = 'sys',
		Active = 1
	WHERE	UserID = @UserID
	
	-- Set the address
	EXEC SetHomeAddress @UserID, '', '', '', @StateProvinceID, @PostalCodeID, @CountryID, @LangID
	
	-- Check alerts for the user to get its state updated
	EXEC TestAllUserAlerts @UserID
END
GO
