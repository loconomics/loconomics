-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-07-15
-- Description:	Automatically checks the reviews
-- providers have from customers to enable or
-- disable the related user-verifications:
-- 11: loconomics user reviewed
-- 12: review from former client
-- =============================================
CREATE PROCEDURE ut_AutocheckReviewVerifications
AS BEGIN

	DECLARE @cur CURSOR
	DECLARE @UserID int, @RevDate datetime
	
	SET @cur = CURSOR FOR
		SELECT	UserID
		FROM	Users
		WHERE	Active = 1 AND IsProvider = 1
		
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN

		-- Check 11: 'Loconomics user reviewed'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID > 0

		IF @RevDate is not null
			EXEC SetUserVerification @UserID, 11, @RevDate, 1

		-- Check 12: 'review from former client'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID = 0		

		IF @RevDate is not null
			EXEC SetUserVerification @UserID, 12, @RevDate, 1

		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END

GO

EXEC ut_AutocheckReviewVerifications
