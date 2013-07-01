/* Some procedures unused previosly
 */
DROP PROCEDURE InsertServiceAcknowledgement
DROP PROCEDURE CalendarSimpleFreeBusyCreate
DROP PROCEDURE CalendarSimpleFreeBusyDelete
DROP PROCEDURE CalendarSimpleFreeBusyGet
DROP PROCEDURE CalendarSimpleFreeBusyGetCollection
DROP PROCEDURE CalendarSimpleFreeBusySync
DROP PROCEDURE CalendarSimpleFreeBusyUpdate

/* Stored procedured previously used, remove only AFTER FULL INTEGRATION
 */
DROP PROCEDURE InsertProviderAvailabilityFreeTime

DROP PROCEDURE CheckProviderAvailability

DROP PROCEDURE GetProviderAvailability_OLD

DROP PROCEDURE GetProviderAvailabilityFullSet

DROP PROCEDURE GetUserFreeTimeSettings

DROP FUNCTION ParseDayOfWeekBitmask

DROP FUNCTION ParseStartTimesBitmask

DROP FUNCTION GetProviderAvailabilityByDateRange

/* Tables previously used to remove AFTER FULL INTEGRATION
 */

DROP TABLE CalendarProviderFreeEvents

DROP TABLE CalendarTimeDayofWeek

DROP TABLE CalendarTimeBlocks
