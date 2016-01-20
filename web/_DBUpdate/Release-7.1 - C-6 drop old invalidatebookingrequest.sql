/****** Object:  StoredProcedure [dbo].[InvalidateBookingRequest]    Script Date: 01/20/2016 14:50:34 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvalidateBookingRequest]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[InvalidateBookingRequest]

