/****** Object:  StoredProcedure [dbo].[CreateService]    Script Date: 07/31/2013 17:16:14 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateService]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[CreateService]
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateService]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[UpdateService]
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UpdateServiceAcknowledgement]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[UpdateServiceAcknowledgement]
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserProfileServiceAttributes]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[GetUserProfileServiceAttributes]
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserReviews]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[GetUserReviews]
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetUserProfileServiceAttributeCategories]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[GetUserProfileServiceAttributeCategories]
