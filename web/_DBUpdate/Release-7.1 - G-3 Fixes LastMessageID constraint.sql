
ALTER TABLE dbo.MessagingThreads
	DROP CONSTRAINT FK_MessagingThreads_Messages

ALTER TABLE dbo.MessagingThreads ADD CONSTRAINT
	FK_MessagingThreads_Messages FOREIGN KEY
	(
	LastMessageID
	) REFERENCES dbo.Messages
	(
	MessageID
	) ON UPDATE  CASCADE 
	 ON DELETE  SET NULL 
	
