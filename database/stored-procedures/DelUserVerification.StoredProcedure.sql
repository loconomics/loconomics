/****** Object:  StoredProcedure [dbo].[DelUserVerification]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-07-15
-- Description:	Delete a user-verification
-- record, if there is one.
-- =============================================
CREATE PROCEDURE [dbo].[DelUserVerification]
	@UserID int,
	@VerificationID int,
    @PositionID int = 0
AS
BEGIN
	DELETE FROM userverification
	WHERE UserID = @UserID
		AND VerificationID = @VerificationID
        AND PositionID = @PositionID
END
GO
