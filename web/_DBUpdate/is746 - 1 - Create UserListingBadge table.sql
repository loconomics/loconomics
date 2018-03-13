CREATE TABLE dbo.UserListingBadge
(UserID int NOT NULL,
UserListingID int NOT NULL,
BadgeURL varchar(2078) NOT NULL,
Type varchar(25) NOT NULL,
Category varchar(25) NOT NULL,
ExpiryDate datetime,
CreatedDate datetime NOT NULL,
ModifiedDate datetime NOT NULL,
CreatedBy nvarchar(12) NOT NULL,
Active bit DEFAULT 1 NOT NULL,
PRIMARY KEY (UserID, UserListingID))