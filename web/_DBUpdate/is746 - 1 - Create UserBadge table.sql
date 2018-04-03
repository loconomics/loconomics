CREATE TABLE dbo.UserBadge
(UserBadgeID int NOT NULL,
UserID int NOT NULL,
SolutionID int NOT NULL,
BadgeURL varchar(2078) NOT NULL,
Type varchar(25) NOT NULL,
Category varchar(25) NOT NULL,
ExpiryDate datetime,
CreatedDate datetime NOT NULL,
ModifiedDate datetime NOT NULL,
CreatedBy nvarchar(12) NOT NULL,
Active bit DEFAULT 1 NOT NULL,
PRIMARY KEY (UserBadgeID))