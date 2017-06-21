SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Allow active or disactive
--  (remove) an alert for an user and position
--  (PositionID=0 for alerts not related with
--  a position), with current Date-Time.
--  
-- =============================================
ALTER PROCEDURE [dbo].[SetUserAlert]
	@UserID int
	,@PositionID int
	,@AlertID int
	,@IsActive bit
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    IF @IsActive = 1 BEGIN
		UPDATE UserAlert WITH (Serializable) SET
			UpdatedDate = getdate(),
			ModifiedBy = 'sys'
		WHERE
			UserID = @UserID
			 AND
			PositionID = @PositionID
			 AND
			AlertID = @AlertID
			
		IF @@RowCount = 0
			INSERT INTO UserAlert (
				UserID, PositionID, AlertID, CreatedDate, UpdatedDate,
				ModifiedBy
			) VALUES (
				@UserID, @PositionID, @AlertID, getdate(), getdate(),
				'sys'
			)

    END ELSE BEGIN
		DELETE FROM UserAlert
		WHERE UserID = @UserID AND PositionID = @PositionID
			AND AlertID = @AlertID
    END
END
GO
