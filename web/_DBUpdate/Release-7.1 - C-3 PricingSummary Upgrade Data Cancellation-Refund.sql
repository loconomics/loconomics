update pricingSummary set
	CancellationFeeCharged = (SubtotalPrice - SubtotalRefunded)
where SubtotalRefunded is not null
