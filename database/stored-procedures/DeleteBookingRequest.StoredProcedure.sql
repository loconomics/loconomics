/****** Object:  StoredProcedure [dbo].[DeleteBookingRequest]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-12-28
-- Description:	Allow fully remove a Booking 
-- Request and related records created for it
-- based on our general rules for booking 
-- invalidation and removing all.
-- This MUST NOT be used normally, only because
-- errors on system, corrupt bookings or testing
-- IMPORTANT: Procedure cannot Refund or Void
-- the Braintree transaction, the booking
-- TransactionID is returned to do it manually,
-- or use the app method LcData.Booking.InvalidateBookingRequest
-- previous deletion to ensure is done auto.
-- =============================================
CREATE PROCEDURE [dbo].[DeleteBookingRequest]
	@BookingRequestID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @invalidOk int
	DECLARE @tranID varchar(250)
	DECLARE @returnMessage varchar(1000)
	
	-- Invalidate the booking request with the general procedure, with a temporary
	-- 'timed out' status, this ensure all related records not need are removed
	-- and all remains clean.
	EXEC @invalidOk = dbo.InvalidateBookingRequest @BookingRequestID, 3

	IF @invalidOk = 0 BEGIN
		-- Get TransactionID to be returned later
		SELECT	@tranID = coalesce(PaymentTransactionID, '__THERE IS NO TRANSACTION__')
		FROM	bookingrequest
		WHERE	BookingRequestID = @BookingRequestID

		-- Remove the request
		DELETE FROM bookingrequest WHERE BookingRequestID = @BookingRequestID
		
		SET @returnMessage = 'Braintree cannot be Refunded or Void from here, do it manually for the next TransactionID if is not a Test: ' + @tranID
	END ELSE
		SET @returnMessage = 'Not deleted, could not be Invalidated becuase error number: ' + Cast(coalesce(@invalidOk, -1) as varchar)

	SELECT @returnMessage As [Message]
	PRINT @returnMessage
END
GO
