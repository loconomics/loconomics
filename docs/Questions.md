# How do you maintain stored procedures and when do you create a stored procedure rather than writing a process in C#/SQL?

While not all stored procedures in our databases are stored in code, we want to do that in the future. Create and update any corresponding scripts in `_DBUpdate/stored-procedures/`.

We do not have a hard and fast rule about when to create a stored procedure, but it is good to create workable code first, and optimize only when necessary.

# How do you delete a user? Do you delete every row associated with that user?

Use the stored procedure, `DeleteUser`. This is normally only used in local databases or the dev database. On live data, we deactivate accounts rather than delete data.
