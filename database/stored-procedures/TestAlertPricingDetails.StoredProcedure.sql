/****** Object:  StoredProcedure [dbo].[TestAlertPricingDetails]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[TestAlertPricingDetails]
	@UserID int,
	@PositionID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 1
    
    
    IF	dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		
		
		EXISTS (SELECT * FROM ProviderPackage
			WHERE ProviderUserID = @UserID
				AND PositionID = @PositionID
				AND Active = 1
		)
	
		BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
