/****** Object:  StoredProcedure [dbo].[TestAlertShowcaseWork]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'showcasework' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertShowcaseWork]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 17
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (SELECT ProviderServicePhotoID FROM ProviderServicePhoto
	WHERE UserID = @UserID
		AND PositionID = @PositionID
		-- Must be almost one photo with address, caption and must be primary photo (to avoid provider has photos but not one chosed as primary)
		AND dbo.fx_IfNW(PhotoAddress, null) is not null
		AND IsPrimaryPhoto = 1
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
