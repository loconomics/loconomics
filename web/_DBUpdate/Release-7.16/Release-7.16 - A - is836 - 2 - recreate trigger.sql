	-- =============================================
	-- Author:		Iago Lorenzo Salgueiro
	-- Create date: 2012-06-01
	-- Description:	Execute all user tests on insert
	--  to active all the alerts
	-- =============================================
	CREATE TRIGGER [dbo].[trigInitialProviderPositionAlertTest]
	ON  [dbo].[userprofilepositions]
	AFTER INSERT
	AS
	BEGIN
		-- SET NOCOUNT ON added to prevent extra result sets from
		-- interfering with SELECT statements.
		SET NOCOUNT ON;

		DECLARE @UserID int, @PositionID int

		SELECT @UserID = UserID, @PositionID = PositionID FROM INSERTED

		EXEC TestAllUserAlerts @UserID, @PositionID

	END
