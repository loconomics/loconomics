/****** Object:  StoredProcedure [dbo].[SetUserVerification]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-07-17
-- Description:	Inserts or update a user 
-- verification record.
-- =============================================
CREATE PROCEDURE [dbo].[SetUserVerification]
	@UserID int
	,@VerificationID int
	,@VerifiedDate datetime
	,@VerificationStatusID int
	,@PositionID int = 0
AS
BEGIN
    UPDATE UserVerification WITH (serializable) SET
        UpdatedDate = getdate(),
        VerifiedBy = 'sys',
        LastVerifiedDate = @VerifiedDate,
        Active = 1,
        VerificationStatusID = @VerificationStatusID,
        PositionID = @PositionID
    WHERE
        UserID = @UserID
         AND
        VerificationID = @VerificationID

    IF @@rowcount = 0 BEGIN
        INSERT INTO UserVerification (
            UserID, VerificationID, DateVerified, CreatedDate, 
            UpdatedDate, VerifiedBy, LastVerifiedDate, Active, VerificationStatusID
        ) VALUES (
            @UserID, @VerificationID, @VerifiedDate, getdate(), getdate(), 'sys', getdate(), 1, @VerificationStatusID
        )
    END
END
GO
