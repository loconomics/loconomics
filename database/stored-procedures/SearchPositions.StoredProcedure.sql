/****** Object:  StoredProcedure [dbo].[SearchPositions]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SearchPositions]
/*
Highlight and execute the following statement to drop the procedure
before executing the create statement.

DROP PROCEDURE dbo.SearchPositions;

*/

-- =============================================
-- Author:      <Author,,Name>
-- Create date: <Create Date,,>
-- Description: <Description,,>
-- =============================================
    -- Add the parameters for the stored procedure here
    @SearchTerm varchar(150),
    @LanguageID int = 1,
    @CountryID int = 1

--exec dbo.GetPositions '%Cleaner%',1,1

AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    -- Insert statements for procedure here
    SELECT DISTINCT 
        c.PositionSingular, c.PositionID, c.PositionDescription
    FROM positions c
    WHERE  
        c.LanguageID = @LanguageID 
        AND c.CountryID = @CountryID
        AND c.Active = 1
        AND (c.Approved = 1 Or c.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
        AND dbo.fx_IfNW(c.PositionSingular, null) is not null
        AND (
            c.PositionSingular like @SearchTerm
             OR
            c.PositionPlural like @SearchTerm
             OR
            c.PositionDescription like @SearchTerm
             OR
            c.Aliases like @SearchTerm
             OR
            c.GovPosition like @SearchTerm
             OR
            c.GovPositionDescription like @SearchTerm
             OR
            EXISTS (
                SELECT *
                FROM    ServiceCategoryPositionAttribute As SP
                         INNER JOIN
                        ServiceAttribute As SA
                          ON SP.ServiceAttributeID = SA.ServiceAttributeID
                            AND SP.Active = 1
                            AND SA.Active = 1
                            AND SA.LanguageID = SP.LanguageID
                            AND SA.CountryID = SP.CountryID
                WHERE
                        SP.PositionID = c.PositionID
                        AND SA.LanguageID = @LanguageID
                        AND SA.CountryID = @CountryID
                        AND (
                         SA.Name like @SearchTerm
                          OR
                         SA.ServiceAttributeDescription like @SearchTerm
                        )
            )
        )

    ORDER BY PositionSingular
END
GO
