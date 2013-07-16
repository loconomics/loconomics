-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-07-15
-- Description:	Automatically checks the reviews
-- providers have from customers to enable or
-- disable the related user-verifications:
-- 11: loconomics user reviewed
-- 12: review from former client
-- =============================================
ALTER PROCEDURE ut_AutocheckReviewVerifications
AS BEGIN

	DECLARE @cur CURSOR
	DECLARE @UserID int, @PositionID int, @RevDate datetime
	
	----------------------------------
	-- Reviews
	
	SET @cur = CURSOR FOR
		SELECT	UserID, PositionID
		FROM	userprofilepositions
		WHERE	Active = 1

	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID, @PositionID
	WHILE @@FETCH_STATUS = 0 BEGIN

		-- Check 12: 'review from former client'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID = 0
			AND PositionID = @PositionID

		IF @RevDate is not null
			-- There is reviews from former clients, verification confirmed
			EXEC SetUserVerification @UserID, 12, @RevDate, 1, @PositionID
		ELSE BEGIN
			-- Check if there is a verification already
			SET @RevDate = null
			SELECT TOP 1 @RevDate = CreatedDate
			FROM UserVerification
			WHERE	UserID = @UserID
					AND VerificationID = 12
					AND (PositionID = 0 OR PositionID = @PositionID)
			IF @RevDate is not null
				-- State: Pending, enough to off the provider-alert but not
				-- show the verification as done.
				-- Verification specific for the position
				EXEC SetUserVerification @UserID, 12, @RevDate, 2, @PositionID
		END

		-- Check 11: 'Loconomics user reviewed'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID > 0
			AND PositionID = @PositionID

		IF @RevDate is not null
			EXEC SetUserVerification @UserID, 11, @RevDate, 1, @PositionID
		ELSE
			EXEC DelUserVerification @UserID, 11, @PositionID

		FETCH NEXT FROM @cur INTO @UserID, @PositionID
	END
	CLOSE @cur
	DEALLOCATE @cur

    -------------------------------
	-- Final check
	
	SET @cur = CURSOR FOR
		SELECT	UserID
		FROM	Users
		WHERE	Active = 1 AND IsProvider = 1
	
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN

		-- Remove old user-verifications for 'loconomics reviews' without positionID,
		-- that doesn't work (and check was already done in previous loop)
		EXEC DelUserVerification @UserID, 11, 0

		-- Remove old user-verifications for 'former customers' without positionID,
		-- that doesn't work (and check was already done in previous loop)
		EXEC DelUserVerification @UserID, 12, 0

		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END

GO

EXEC ut_AutocheckReviewVerifications

EXEC TestAllUsersAlerts