SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2014-02-18
-- Description:	Set field SentByUserId based on
-- the MessageTypeID
-- =============================================
CREATE TRIGGER AutoSetMessageSentByUserId
   ON  Messages
   AFTER INSERT
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	UPDATE Messages SET
		SentByUserId = CASE 
		WHEN MessageTypeID IN (1, 2, 4, 5, 6, 9, 12, 14, 16, 18) THEN T.CustomerUserID
		WHEN MessageTypeID IN (3, 7, 10, 13, 15, 17) THEN T.ProviderUserID
		WHEN MessageTypeID IN (8, 19) THEN 0 -- the system
		END
	FROM MessagingThreads AS T
	WHERE T.ThreadID = Messages.ThreadID
	AND SentByUserId is null
END
GO
