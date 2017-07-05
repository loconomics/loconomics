/*
  Remove unused Alerts
      basicinfoverification
      socialmediaverification
      backgroundcheck
      referencerequests
      required-backgroundcheck
*/

/*
  Remove user alerts based on the removed alerts
*/
DELETE UA
FROM UserAlert UA
INNER JOIN Alert A ON UA.AlertID = A.AlertID
WHERE A.AlertName IN ('basicinfoverification', 'socialmediaverification', 'backgroundcheck', 'referencerequests', 'required-backgroundcheck');

/* 
  Remove stored procedures for removed alerts
*/
DROP PROCEDURE [dbo].[TestAlertBasicInfoVerification]
DROP PROCEDURE [dbo].[TestAlertSocialMediaVerification]
DROP PROCEDURE [dbo].[TestAlertBackgroundCheck]
DROP PROCEDURE [dbo].[TestAlertReferenceRequests]

/*
  Remove the Alerts
*/
DELETE FROM Alert
WHERE AlertName IN ('basicinfoverification', 'socialmediaverification', 'backgroundcheck', 'referencerequests', 'required-backgroundcheck');
