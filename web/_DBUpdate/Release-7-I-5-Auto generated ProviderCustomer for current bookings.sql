-- Create ProviderCustomer relationship for confirmed bookings
-- that exists on database
insert into ProviderCustomer (
	ProviderUserID,
	CustomerUserID,
	NotesAboutCustomer,
	ReferralSourceID,
	CreatedDate,
	UpdatedDate,
	Active
)
select distinct
	br.ProviderUserID,
	br.CustomerUserID,
	'',
	11, -- Other
	GETDATE(),
	GETDATE(),
	1
from users as u
inner join bookingrequest as br on br.CustomerUserID = u.UserID and u.Active = 1
inner join booking as b on b.BookingRequestID = br.BookingRequestID
where br.ProviderUserID != br.CustomerUserID
