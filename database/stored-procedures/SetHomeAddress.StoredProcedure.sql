/****** Object:  StoredProcedure [dbo].[SetHomeAddress]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-04-08
-- Description:	Sets the data for the user
-- special 'Home' address, updating the
-- address or inserting a new record if
-- not exists
-- =============================================
CREATE PROCEDURE [dbo].[SetHomeAddress]
	@UserID int,
	@AddressLine1 varchar(100),
	@AddressLine2 varchar(100),
	@City varchar(100),
	@StateProvinceID int,
	@PostalCodeID int,
	@CountryID int,
	@LanguageID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    UPDATE  Address WITH (serializable)
    SET     AddressLine1 = @AddressLine1
            ,AddressLine2 = @AddressLine2
            ,City = @City
            ,StateProvinceID = @StateProvinceID
            ,PostalCodeID = @PostalCodeID
            ,CountryID = @CountryID

            ,Active = 1
            ,UpdatedDate = getdate()
            ,ModifiedBy = 'sys'
    WHERE   UserId = @UserID
                AND
            AddressTypeID = 1 -- Ever Type: Home

    IF @@rowcount = 0
    BEGIN
        DECLARE @AddressName nvarchar(50)
        SELECT @AddressName = AddressType
        FROM AddressType
        WHERE AddressTypeID = 1 -- Home
                AND LanguageID = @LanguageID
                AND CountryID = @CountryID

        INSERT INTO Address (UserID, AddressTypeID, AddressName,
            AddressLine1, AddressLine2, City, StateProvinceID, PostalCodeID, CountryID,
            Active, CreatedDate, UpdatedDate, ModifiedBy)
        VALUES (@UserID, 1 /* Type: Home */, @AddressName, 
            @AddressLine1, @AddressLine2, @City, @StateProvinceID, @PostalCodeID, @CountryID, 
            1, getdate(), getdate(), 'sys')
    END
END
GO
