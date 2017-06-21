/****** Object:  StoredProcedure [dbo].[TestProfileActivation]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[TestProfileActivation]
	@UserID int,
	@PositionID int = 0
AS
BEGIN
	
	
	SET NOCOUNT ON;
    DECLARE @cur CURSOR
    
    IF @PositionID = 0 BEGIN
		SET @cur = CURSOR FOR 
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0
			 
		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN
			
			EXEC TestProfileActivation @UserID, @PositionID
			
			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur
    END ELSE BEGIN

		-- StatusID (marketplaceReady and auto switch status)
		IF (SELECT TOP 1 StatusID FROM UserProfilePositions
			WHERE UserID = @UserID AND PositionID = @PositionID)
			IN (1, 2) -- Its a state for automatic activation
		BEGIN	
			
			UPDATE UserProfilePositions SET
				StatusID = 
				CASE WHEN (SELECT count(*)
					FROM UserAlert As UA
						 INNER JOIN
						Alert As A
						  ON UA.AlertID = A.AlertID
					WHERE UA.UserID = @UserID
							AND
						  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
							AND
						  A.Required = 1
				) = 0 THEN 1 
				ELSE 2 
				END,
				
				UpdatedDate = GETDATE(),
				ModifiedBy = 'sys'
			WHERE	
				UserID = @UserID AND PositionID = @PositionID
		END
		
		-- Flag BookMeButtonReady
		UPDATE UserProfilePositions SET
			bookMeButtonReady = 
			CASE WHEN (SELECT count(*)
				FROM UserAlert As UA
					 INNER JOIN
					Alert As A
					  ON UA.AlertID = A.AlertID
				WHERE UA.UserID = @UserID
						AND
					  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
						AND
					  A.bookMeButtonRequired = 1
			) = 0 THEN 1 
			ELSE 0 
			END,
			
			UpdatedDate = GETDATE(),
			ModifiedBy = 'sys'
		WHERE	
			UserID = @UserID AND PositionID = @PositionID
	END
END

GO
