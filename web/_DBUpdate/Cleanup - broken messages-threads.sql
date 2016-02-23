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

-- REMOVE CORRUPTED THREADS, EMPTY ONES (BECAUSE PREVIOUS CLEAN-UP OF MESSAGES)
DELETE FROM MessagingThreads WHERE
0 = (SELECT count(*) FROM Messages WHERE messages.ThreadID = MessagingThreads.ThreadID)