-- THREADS/MESSAGES
-- REMOVING BAD MESSAGING RECORDS, BROKEN RELATIONSHIPS
-- READY TO ENFORCE THAT BY CREATING FOREIGN KEYS

DELETE FROM MessagingThreads WHERE
CustomerUserID NOT IN (select userid from userprofile)
OR ProviderUserID NOT IN (select userid from userprofile)

-- REMOVE CORRUPTED MESSAGES, RELATED TO BOOKINGS THAT DO NOT EXISTS
DELETE FROM Messages WHERE 
AuxT is null
AND AuxID NOT IN (select bookingid from booking)

-- remove bad status messages
DELETE FROM Messages where MessageTypeID not in (select MessageTypeID from messagetype)

-- remove orphan messages, without threadid
DELETE FROM Messages where ThreadID not in (select ThreadID from MessagingThreads)

-- SentByUser that does not exists anymore
DELETE FROM Messages WHERE 
SentByUserId not in (select userid from userprofile)
DELETE FROM MessagingThreads WHERE
ThreadID IN (SELECT ThreadID FROM Messages WHERE 
SentByUserId not in (select userid from userprofile))

-- Bad LastMessageID
UPDATE MessagingThreads SET LastMessageID = null WHERE LastMessageID NOT IN (select messageid from Messages)

-- REMOVE CORRUPTED THREADS, EMPTY ONES (BECAUSE PREVIOUS CLEAN-UP OF MESSAGES)
DELETE FROM MessagingThreads WHERE
0 = (SELECT count(*) FROM Messages WHERE messages.ThreadID = MessagingThreads.ThreadID)
