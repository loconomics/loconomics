/****** Object:  StoredProcedure [dbo].[TestAlertTaxDocs]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'taxdocs' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertTaxDocs]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 6
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT ProviderUserID FROM ProviderTaxForm
	WHERE ProviderUserID = @UserID
		AND dbo.fx_IfNW(FullName, null) is not null
		AND dbo.fx_IfNW(StreetApt, null) is not null
		AND dbo.fx_IfNW(City, null) is not null
		AND dbo.fx_IfNW(PostalCodeID, null) is not null
		AND dbo.fx_IfNW(StateProvinceID, null) is not null
		AND dbo.fx_IfNW(CountryID, null) is not null
		AND dbo.fx_IfNW([Signature], null) is not null
		AND dbo.fx_IfNW(TINTypeID, null) is not null
		AND dbo.fx_IfNW(DateTimeSubmitted, null) is not null
		AND dbo.fx_IfNW(LastThreeTINDigits, null) is not null
		AND (
		 TaxEntityTypeID = 1
		  OR
		 dbo.fx_IfNW(BusinessName, null) is not null
		)
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
GO
