DELETE FROM CalendarProviderAttributes WHERE userID NOT IN (select userID from users)