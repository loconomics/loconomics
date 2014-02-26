UPDATE Messages SET
	SentByUserId = CASE 
	WHEN MessageTypeID IN (1, 2, 4, 5, 6, 9, 12, 14, 16, 18) THEN T.CustomerUserID
	WHEN MessageTypeID IN (3, 7, 10, 13, 15, 17) THEN T.ProviderUserID
	WHEN MessageTypeID IN (8, 19) THEN 0 -- the system
	END
FROM MessagingThreads AS T
WHERE T.ThreadID = Messages.ThreadID
AND SentByUserId is null