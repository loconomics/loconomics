/****** Object:  StoredProcedure [dbo].[TestAlertPositionServices]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'positionservices' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPositionServices]
	@UserID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 8
	
	DECLARE @CATS TABLE (CatID int)
	
	INSERT INTO @CATS (CatID)
	SELECT DISTINCT A.ServiceAttributeCategoryID
	FROM ServiceAttributeCategory As A
		  INNER JOIN
		 ServiceCategoryPositionAttribute As B
		   ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
			AND B.PositionID = @PositionID
	WHERE A.RequiredInput = 1
		AND A.Active = 1
		AND B.Active = 1
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		-- Check all required data
		-- Must have almost one service attribute selected 
		-- per required category for the position
		@PositionID = 0
		OR (SELECT count(*) FROM (SELECT A.ServiceAttributeCategoryID
		FROM userprofileserviceattributes As A
		 INNER JOIN
		ServiceCategoryPositionAttribute As B
		  ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
		   AND A.ServiceAttributeID = B.ServiceAttributeID
		  -- We only check the 'RequiredInput' Categories
		   AND B.ServiceAttributeCategoryID IN (SELECT CatID FROM @CATS)
		WHERE A.UserID = @UserID AND A.PositionID = @PositionID
			AND A.Active = 1 AND B.Active = 1
		GROUP BY A.ServiceAttributeCategoryID
	) As Z) = (SELECT count(*) FROM @CATS)
	BEGIN
		--PRINT 'you''re cool!'
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		--PRINT 'buuuhhhh!'
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
