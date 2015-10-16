update users set 
	IsProvider = coalesce(IsProvider, cast(0 as bit)),
	IsCustomer = coalesce(IsCustomer, cast(0 as bit)),
	IsAdmin = coalesce(IsAdmin, cast(0 as bit))