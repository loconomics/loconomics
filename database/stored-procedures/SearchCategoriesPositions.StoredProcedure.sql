/****** Object:  StoredProcedure [dbo].[SearchCategoriesPositions]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[SearchCategoriesPositions]

@LanguageID int = 1,
@CountryID int  = 1,
@ServiceCategoryID int = 1,
@ServiceSubCategoryID int = 1
as

--exec [dbo].[SearchCategoriesPositions] 1,1

-- Need a rank attribute for each user position for preferred provider

SELECT  
c.ServiceSubCategoryID,
c.Name,
c.Rank as ServiceRank,
b.positionid,  
a.PositionSingular  as position,
tpur.PrivateReview,
tpur.PublicReview, 
tpur.Rating1,
tpur.Rating2,
tpur.Rating3,
MIN(up.UserID),
COUNT(DISTINCT BookingID) AS ReviewCount,
0 as VerificationsCount,
0 as LicensesCount

FROM  positions a 

LEFT JOIN servicecategoryposition  b   
  ON a.positionid = b.positionid  

LEFT JOIN servicesubcategory c  
  ON b.ServiceCategoryID = c.ServiceCategoryID  

LEFT JOIN dbo.userprofilepositions up
  ON a.positionid = up.PositionID
  AND a.LanguageID = up.LanguageID
  AND a.CountryID = up.CountryID

LEFT JOIN UserReviews ur
  ON a.PositionID = ur.PositionID
  AND up.UserID = ur.ProviderUserID

LEFT JOIN (SELECT TOP 1 ProviderUserID,
                        PositionID,
                        PrivateReview,
                        PublicReview ,
                        Rating1,
                        Rating2,
                        Rating3
           FROM dbo.UserReviews ORDER BY CreatedDate) tpur
           
on ur.PositionID = tpur.PositionID 
and ur.ProviderUserID = tpur.ProviderUserID

WHERE a.LanguageID = @LanguageID and a.CountryID = @CountryID
and c.ServiceCategoryID = @ServiceCategoryID
and c.ServiceSubCategoryID = @ServiceSubCategoryID
and c.rank <=5
GROUP BY c.ServiceSubCategoryID,
c.Name,
c.Rank,
b.positionid,  
a.PositionSingular,
tpur.PrivateReview,
tpur.PublicReview, 
tpur.Rating1,
tpur.Rating2,
tpur.Rating3

GO
