/* Update alerts that are shared with customers */
UPDATE Alert SET CustomerAlert = Cast(1 as bit)
WHERE AlertID IN (3, 4, 9, 11, 15)